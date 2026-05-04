const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// JWT utility functions
class AuthUtils {
    // Generate JWT token
    static generateToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    }

    // Generate refresh token
    static generateRefreshToken(payload, expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d') {
        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });
    }

    // Verify JWT token
    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    // Hash password
    static async hashPassword(password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        return await bcrypt.hash(password, rounds);
    }

    // Compare password
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Generate random token
    static generateRandomToken(length = 32) {
        return require('crypto').randomBytes(length).toString('hex');
    }

    // Hash token for storage
    static hashToken(token) {
        return require('crypto').createHash('sha256').update(token).digest('hex');
    }
}

// Authentication middleware
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Yêu cầu token xác thực'
            });
        }

        const token = authHeader.substring(7);
        const decoded = AuthUtils.verifyToken(token);

        // Check if session exists and is active
        const dbType = process.env.DB_TYPE || 'mysql';
        let dateCheck;
        
        if (dbType === 'mssql') {
            dateCheck = 'expires_at > GETDATE()';
        } else {
            dateCheck = 'expires_at > NOW()';
        }
        
        // Support both 'token' (MySQL schema) and 'token_hash' (MSSQL schema)
        const session = await db.findOne(
            `SELECT * FROM user_sessions WHERE user_id = ? AND token = ? AND is_active = 1 AND ${dateCheck}`,
            [decoded.userId, token]
        );

        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'
            });
        }

        // Get user details
        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, role, membership_status, is_active FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại hoặc đã bị khóa'
            });
        }

        // Attach user to request
        req.user = user;
        req.session = session;
        
        next();
    } catch (error) {
        console.error('Authentication error detail:', error.message, error.stack?.split('\n')[1]);
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        });
    }
};

// Authorization middleware (role-based)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Yêu cầu xác thực'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này'
            });
        }

        next();
    };
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = AuthUtils.verifyToken(token);

            const user = await db.findOne(
                'SELECT id, email, username, first_name, last_name, role, membership_status FROM users WHERE id = ? AND is_active = 1',
                [decoded.userId]
            );

            if (user) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

// Session management
class SessionManager {
    // Create new session
    static async createSession(userId, deviceInfo = {}) {
        const token = AuthUtils.generateToken({ userId });
        const refreshToken = AuthUtils.generateRefreshToken({ userId });
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        try {
            // Insert session - DB thực tế dùng cột 'token' và 'refresh_token'
            const sessionData = {
                user_id: userId,
                token: token,
                refresh_token: refreshToken,
                device_info: JSON.stringify(deviceInfo),
                ip_address: deviceInfo.ip,
                user_agent: deviceInfo.userAgent,
                expires_at: expiresAt
            };

            const sessionId = await db.insert('user_sessions', sessionData);

            return {
                sessionId,
                token,
                refreshToken,
                expiresAt
            };
        } catch (error) {
            // If duplicate token error, delete old session and retry
            if (error.number === 2627 || error.code === 'ER_DUP_ENTRY') {
                console.log('Duplicate token detected, cleaning up old session...');
                
                await db.delete('user_sessions', 'token = ?', [token]);
                
                // Retry insert
                const sessionId = await db.insert('user_sessions', sessionData);

                return {
                    sessionId,
                    token,
                    refreshToken,
                    expiresAt
                };
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    // Refresh session
    static async refreshSession(refreshToken) {
        try {
            const decoded = AuthUtils.verifyRefreshToken(refreshToken);

            const session = await db.findOne(
                'SELECT * FROM user_sessions WHERE user_id = ? AND refresh_token = ? AND is_active = 1',
                [decoded.userId, refreshToken]
            );

            if (!session) {
                throw new Error('Invalid refresh token');
            }

            // Generate new tokens
            const newToken = AuthUtils.generateToken({ userId: decoded.userId });
            const newRefreshToken = AuthUtils.generateRefreshToken({ userId: decoded.userId });
            
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            // Update session
            await db.update(
                'user_sessions',
                { token: newToken, refresh_token: newRefreshToken, expires_at: expiresAt },
                'id = ?',
                [session.id]
            );

            return {
                token: newToken,
                refreshToken: newRefreshToken,
                expiresAt
            };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    // Revoke session
    static async revokeSession(sessionId) {
        return await db.update(
            'user_sessions',
            { is_active: false },
            'id = ?',
            [sessionId]
        );
    }

    // Revoke all user sessions
    static async revokeAllUserSessions(userId) {
        return await db.update(
            'user_sessions',
            { is_active: false },
            'user_id = ?',
            [userId]
        );
    }

    // Clean expired sessions
    static async cleanExpiredSessions() {
        const dbType = process.env.DB_TYPE || 'mysql';
        const dateFunc = dbType === 'mssql' ? 'GETDATE()' : 'NOW()';
        return await db.delete(
            'user_sessions',
            `expires_at < ${dateFunc} OR is_active = 0`,
            []
        );
    }

    // Get user sessions
    static async getUserSessions(userId) {
        return await db.query(
            'SELECT id, device_info, ip_address, created_at, expires_at FROM user_sessions WHERE user_id = ? AND is_active = 1',
            [userId]
        );
    }
}

/**
 * Middleware: Require Admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Yêu cầu xác thực'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Chỉ Admin mới có quyền truy cập'
        });
    }
    
    next();
};

/**
 * Middleware: Authenticate Token (alias for authenticate)
 */
const authenticateToken = authenticate;

/**
 * Middleware: Chỉ verify JWT token, KHÔNG check DB session
 * Dùng cho các endpoint ít nhạy cảm như upload ảnh
 */
const authenticateJwt = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Yêu cầu token xác thực'
            });
        }

        const token = authHeader.substring(7);
        const decoded = AuthUtils.verifyToken(token);

        // Chỉ lấy user từ DB, không check session
        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, role, membership_status, is_active FROM users WHERE id = ? AND is_active = 1',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại hoặc đã bị khóa'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        });
    }
};

module.exports = {
    AuthUtils,
    authenticate,
    authenticateToken,
    authenticateJwt,
    authorize,
    optionalAuth,
    requireAdmin,
    SessionManager
};