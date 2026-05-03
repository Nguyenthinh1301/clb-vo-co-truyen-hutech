const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Import database and middleware
const db = require('./config/db');
const swaggerSpec = require('./config/swagger');
const logger = require('./services/loggerService');
const schedulerService = require('./services/schedulerService');
const { cacheService } = require('./services/cacheService');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const websocketService = require('./services/websocketService');

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow all origins in development
const corsOptions = {
    origin: function (origin, callback) {
        // Always allow: no origin (file://, curl, mobile), or development mode
        if (!origin || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        // Production: check whitelist
        const allowed = (process.env.CORS_ORIGIN || '')
            .split(',').map(o => o.trim()).filter(Boolean);
        if (allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 50 : 100),
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    }
});

// Strict rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 5 : 10000,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    },
    keyGenerator: (req) => req.ip
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.'
    }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);

// Body parsing middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        let dbStatus = { success: true, message: 'Connected' };
        try {
            const testResult = await db.testConnection();
            if (testResult && testResult.success !== false) {
                dbStatus = { success: true, message: 'Database connected' };
            } else {
                dbStatus = { success: false, message: testResult?.message || 'Database connection failed' };
            }
        } catch (dbError) {
            dbStatus = { success: false, message: dbError.message };
        }

        // Get database stats safely
        let dbStats = null;
        try {
            if (db.getStats) {
                dbStats = await db.getStats();
            }
        } catch (error) {
            // Ignore stats errors
        }

        // Get cache stats safely
        let cacheStats = null;
        try {
            cacheStats = cacheService.getStats();
        } catch (error) {
            // Ignore cache errors
        }

        // Get scheduler status safely
        let schedulerStatus = null;
        try {
            schedulerStatus = schedulerService.getJobStatus();
        } catch (error) {
            // Ignore scheduler errors
        }
        
        res.json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            database: dbStatus,
            // Ẩn thông tin chi tiết trong production
            connections: process.env.NODE_ENV !== 'production' ? dbStats : undefined,
            cache: process.env.NODE_ENV !== 'production' ? cacheStats : undefined,
            scheduler: process.env.NODE_ENV !== 'production' ? schedulerStatus : undefined,
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
});

// API Documentation — chỉ bật trong development
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'CLB Võ Cổ Truyền HUTECH API Docs'
    }));
} else {
    app.get('/api-docs', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));
}

// API Routes
app.use('/health', require('./routes/health'));

// API Versioning
app.use('/api/v1', require('./routes/v1'));

// Legacy routes (redirect to v1)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/events', require('./routes/events'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/user', require('./routes/user-dashboard'));
app.use('/api/user/content', require('./routes/user-content'));
app.use('/api/public', require('./routes/public-content'));
app.use('/api/cms', require('./routes/admin-cms'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/gallery', require('./routes/gallery'));

// Serve static files (uploads) — dùng absolute path để tránh lỗi khi chạy từ thư mục khác
// Thêm security headers để ngăn browser thực thi file HTML/SVG được upload
const path = require('path');
app.use('/uploads', (req, res, next) => {
    // Ngăn browser render HTML/SVG như trang web — chỉ download
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    // Cache ảnh 7 ngày — ảnh upload không thay đổi (tên file là hash)
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    
    try {
        // Stop scheduler
        schedulerService.stop();
        
        // Close database connections
        await db.close();
        console.log('Database connections closed');
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    
    try {
        // Stop scheduler
        schedulerService.stop();
        
        // Close database connections
        await db.close();
        console.log('Database connections closed');
        
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start server
const PORT = process.env.PORT || 3001;
// Production: listen 0.0.0.0 để nhận kết nối từ bên ngoài
// Development: listen localhost để bảo mật hơn
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');

const server = app.listen(PORT, HOST, () => {
    console.log(`
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://${HOST}:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Health check: http://${HOST}:${PORT}/health
📚 API Docs: http://${HOST}:${PORT}/api-docs
🔌 WebSocket: Enabled
📡 API Version: v1
    `);
    
    // Initialize WebSocket
    websocketService.initialize(server);
    
    // Start scheduler service
    schedulerService.start();
    
    // Log startup info
    logger.info('Server started successfully', {
        port: PORT,
        host: HOST,
        environment: process.env.NODE_ENV,
        websocket: 'enabled'
    });
});

module.exports = app;
