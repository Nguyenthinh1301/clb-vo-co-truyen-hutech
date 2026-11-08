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
const { clientIp, isLocalRequest } = require('./utils/clientIp');

// Create Express app
const app = express();

// Render/Netlify đặt server sau 1 reverse proxy → tin header X-Forwarded-For của 1 hop
// để req.ip là IP thật của client (rate limit mới tính riêng từng người)
app.set('trust proxy', parseInt(process.env.TRUST_PROXY_HOPS) || 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow all origins in development, whitelist in production
const corsOptions = {
    origin: function (origin, callback) {
        // Always allow: no origin (file://, curl, mobile apps)
        if (!origin) {
            return callback(null, true);
        }
        
        // Development mode: allow all localhost/127.0.0.1 with any port
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Production: allow localhost/127.0.0.1 with any port (for local testing)
        // Regex: http(s)://localhost:port or http(s)://127.0.0.1:port
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (localhostRegex.test(origin)) {
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
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 500 : 1000),
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp,
    // Bỏ qua rate limit cho localhost (development)
    skip: (req) => process.env.NODE_ENV === 'development' && isLocalRequest(req)
});

// Strict rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 20 : 10000,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' && isLocalRequest(req),
    keyGenerator: clientIp
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 password reset attempts per hour
    keyGenerator: clientIp,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.'
    }
});

app.use('/api/', generalLimiter);
// Áp dụng cho cả route legacy lẫn /api/v1 (trước đây /api/v1/auth/login không bị giới hạn)
app.use(['/api/auth/login', '/api/v1/auth/login'], loginLimiter);
app.use(['/api/auth/forgot-password', '/api/v1/auth/forgot-password'], passwordResetLimiter);

// Body parsing middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Compression middleware
app.use(compression());

// Logging middleware (tắt khi chạy test để output gọn)
const IS_JEST = !!process.env.JEST_WORKER_ID;
if (IS_JEST) {
    // không log request trong test
} else if (process.env.NODE_ENV === 'development') {
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
app.use('/api/activities', require('./routes/activities'));

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

// Tự động tạo/kích hoạt admin user khi khởi động
async function ensureAdminUser() {
    try {
        const { AuthUtils } = require('./middleware/auth');
        const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@vocotruyenhutech.edu.vn';
        const adminUsername = process.env.ADMIN_USERNAME || 'admin_hutech';
        // Không còn mật khẩu mặc định cứng trong code: nếu thiếu ADMIN_PASSWORD thì sinh ngẫu nhiên
        const generatedPassword = !process.env.ADMIN_PASSWORD;
        const adminPassword = process.env.ADMIN_PASSWORD
            || require('crypto').randomBytes(12).toString('base64url') + 'Aa1';

        // Tìm admin (kể cả inactive)
        const existing = await db.findOne('SELECT id, email, is_active FROM users WHERE email = ?', [adminEmail]);

        if (existing) {
            // Đảm bảo admin đang active
            if (!existing.is_active) {
                await db.update('users', { is_active: true }, 'id = ?', [existing.id]);
                console.log('✅ Admin re-activated:', adminEmail);
            } else {
                console.log('✅ Admin user OK:', adminEmail);
            }
            return;
        }

        // Tạo mới nếu chưa có
        const passwordHash = await AuthUtils.hashPassword(adminPassword);

        // Kiểm tra DB dùng cột 'password' hay 'password_hash' (do migration 001 đổi tên)
        const colCheck = await db.findOne(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'"
        );
        const pwField = colCheck ? 'password_hash' : 'password';

        await db.insert('users', {
            email:             adminEmail,
            username:          adminUsername,
            [pwField]:         passwordHash,
            first_name:        'Admin',
            last_name:         'CLB',
            full_name:         'Administrator',
            role:              'admin',
            membership_status: 'active',
            is_active:         true,
            email_verified:    true
        });
        // Không bao giờ ghi mật khẩu ra log production
        if (generatedPassword && process.env.NODE_ENV !== 'production') {
            console.log('✅ Admin user created:', adminEmail, '— mật khẩu tạm (chỉ hiện ở dev):', adminPassword);
        } else {
            console.log('✅ Admin user created:', adminEmail,
                generatedPassword ? '— mật khẩu ngẫu nhiên, hãy reset bằng scripts/reset-admin-production.js' : '');
        }
    } catch (err) {
        console.error('⚠️  ensureAdminUser failed:', err.message);
    }
}

// Start server
const PORT = process.env.PORT || 3001;
// Production: listen 0.0.0.0 để nhận kết nối từ bên ngoài
// Development: listen localhost để bảo mật hơn
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');

// Khi chạy dưới Jest: chỉ export app cho supertest, không mở cổng / không chạy cron / không tạo admin
if (!IS_JEST) startServer();

function startServer() {
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

    // Đảm bảo admin user tồn tại trong DB
    ensureAdminUser().catch(err => console.error('ensureAdminUser error:', err.message));
});
}

module.exports = app;
