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
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // In production, check allowed origins
        const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
        if (allowedOrigins.indexOf(origin) !== -1) {
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
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    }
});

// Strict rate limiting for login endpoint (nới lỏng cho development)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 10000 : 10, // 10000 cho dev, 10 cho production
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    },
    // Sử dụng chỉ IP để tránh phức tạp
    keyGenerator: (req) => {
        return req.ip;
    }
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
            connections: dbStats,
            cache: cacheStats,
            scheduler: schedulerStatus,
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

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CLB Võ Cổ Truyền HUTECH API Docs'
}));

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
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/stats', require('./routes/admin-stats'));
app.use('/api/admin/members', require('./routes/members'));
app.use('/api/admin/content', require('./routes/admin-content'));
app.use('/api/admin/notifications', require('./routes/admin-notifications'));
app.use('/api/admin/class-management', require('./routes/admin-class-management'));
app.use('/api/admin/points', require('./routes/admin-points'));
app.use('/api/user', require('./routes/user-dashboard'));
app.use('/api/user/content', require('./routes/user-content'));
app.use('/api/points', require('./routes/points'));

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

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
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

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
