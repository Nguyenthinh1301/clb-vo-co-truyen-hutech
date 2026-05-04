const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auditLog = require('../utils/auditLog');
const { AuthUtils, authenticate, SessionManager } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');
const NotificationService = require('../services/notificationService');

// Register new user
router.post('/register', ValidationRules.userRegistration, handleValidationErrors, async (req, res) => {
    try {
        const {
            email,
            username,
            password,
            first_name,
            last_name,
            phone_number,
            date_of_birth,
            gender,
            address
        } = req.body;

        // Check if email already exists
        const existingEmail = await db.findOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Check if username already exists
        const existingUsername = await db.findOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: 'Username đã được sử dụng'
            });
        }

        // Hash password
        const passwordHash = await AuthUtils.hashPassword(password);

        // Create user
        const userId = await db.insert('users', {
            email,
            username,
            password: passwordHash,
            first_name,
            last_name,
            full_name: `${first_name} ${last_name}`.trim(),
            phone_number: phone_number || null,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            address: address || null,
            role: 'student',
            membership_status: 'pending'
        });

        // Get created user (without password)
        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, full_name, phone_number, role, membership_status, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Create session
        const deviceInfo = {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };
        const session = await SessionManager.createSession(userId, deviceInfo);

        // Log successful registration
        await auditLog({
            user_id: userId,
            action: 'user_registered',
            table_name: 'users',
            record_id: userId,
            new_values: JSON.stringify({ email, username, role: 'student' }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        // Send notifications asynchronously (don't block registration)
        // Wrap in setImmediate to ensure it runs after response is sent
        setImmediate(async () => {
            try {
                // Send notification to admins about new registration
                await NotificationService.notifyNewUserRegistration(user);
            } catch (err) {
                console.error('Failed to notify admins about new registration:', err);
            }
            
            try {
                // Send welcome notification to new user
                await NotificationService.sendWelcomeNotification(userId, user.full_name || user.first_name);
            } catch (err) {
                console.error('Failed to send welcome notification:', err);
            }
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user,
                token: session.token,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký'
        });
    }
});

// Login user
router.post('/login', ValidationRules.userLogin, handleValidationErrors, async (req, res) => {
    try {
        const { email, password, remember_me } = req.body;
        const clientIP = req.ip;
        const userAgent = req.get('User-Agent');

        // Find user by email or username (email can be used as username too)
        const user = await db.findOne(
            'SELECT * FROM users WHERE (email = ? OR username = ?) AND is_active = 1',
            [email, email] // Using email for both email and username search
        );

        // Log login attempt (non-blocking, don't fail if logging fails)
        try {
            await db.insert('login_attempts', {
                email,
                ip_address: clientIP,
                user_agent: userAgent,
                success: false,
                failure_reason: user ? 'invalid_password' : 'user_not_found'
            });
        } catch (logError) {
            console.error('Failed to log login attempt:', logError);
            // Continue with login process even if logging fails
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Check password - support both 'password' (MSSQL schema) and 'password_hash' (MySQL schema)
        const passwordField = user.password_hash || user.password;
        const isValidPassword = await AuthUtils.comparePassword(password, passwordField);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        // Update successful login attempt (get the most recent one)
        // Use database-agnostic query (non-blocking, don't fail if update fails)
        try {
            const dbType = process.env.DB_TYPE || 'mysql';
            let recentAttemptsQuery;
            
            if (dbType === 'mssql') {
                recentAttemptsQuery = 'SELECT TOP 1 id FROM login_attempts WHERE email = ? AND ip_address = ? ORDER BY attempted_at DESC';
            } else {
                recentAttemptsQuery = 'SELECT id FROM login_attempts WHERE email = ? AND ip_address = ? ORDER BY attempted_at DESC LIMIT 1';
            }
            
            const recentAttempts = await db.query(recentAttemptsQuery, [email, clientIP]);
            // db.query trả về [rows, null] — lấy rows[0]
            const attemptsRows = Array.isArray(recentAttempts[0]) ? recentAttempts[0] : recentAttempts;
            
            if (attemptsRows && attemptsRows.length > 0) {
                await db.update('login_attempts', 
                    { success: true, failure_reason: null }, 
                    'id = ?', 
                    [attemptsRows[0].id]
                );
            }
        } catch (updateError) {
            console.error('Failed to update login attempt:', updateError);
            // Continue with login process even if update fails
        }

        // Update last login
        await db.update('users', { last_login_at: new Date() }, 'id = ?', [user.id]);

        // Create session
        const deviceInfo = {
            ip: clientIP,
            userAgent: userAgent
        };
        const session = await SessionManager.createSession(user.id, deviceInfo);

        // Remove password_hash from response
        const { password_hash: userPasswordHash, ...userWithoutPassword } = user;

        // Log successful login
        await auditLog({
            user_id: user.id,
            action: 'user_login',
            table_name: 'users',
            record_id: user.id,
            ip_address: clientIP,
            user_agent: userAgent
        });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                user: userWithoutPassword,
                token: session.token,
                refreshToken: session.refreshToken,
                expiresAt: session.expiresAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        console.error('Login error stack:', error.stack);
        console.error('Login error detail:', JSON.stringify({ message: error.message, code: error.code, detail: error.detail }));
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập'
        });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token là bắt buộc'
            });
        }

        const newTokens = await SessionManager.refreshSession(refreshToken);

        res.json({
            success: true,
            message: 'Token đã được làm mới',
            data: newTokens
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Refresh token không hợp lệ'
        });
    }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
    try {
        // Revoke current session
        await SessionManager.revokeSession(req.session.id);

        // Log logout
        await auditLog({
            user_id: req.user.id,
            action: 'user_logout',
            table_name: 'users',
            record_id: req.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất'
        });
    }
});

// Logout from all devices
router.post('/logout-all', authenticate, async (req, res) => {
    try {
        // Revoke all user sessions
        await SessionManager.revokeAllUserSessions(req.user.id);

        // Log logout all
        await auditLog({
            user_id: req.user.id,
            action: 'user_logout_all',
            table_name: 'users',
            record_id: req.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Đã đăng xuất khỏi tất cả thiết bị'
        });

    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng xuất'
        });
    }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await db.findOne(
            `SELECT id, email, username, first_name, last_name, phone_number, 
             date_of_birth, gender, address, profile_image, role, membership_status, 
             belt_level, join_date, last_login_at, email_verified, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin người dùng'
        });
    }
});

// Change password
router.put('/change-password', authenticate, ValidationRules.changePassword, handleValidationErrors, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Get current user with password
        const user = await db.findOne('SELECT password FROM users WHERE id = ?', [req.user.id]);

        // Verify current password
        const isValidPassword = await AuthUtils.comparePassword(current_password, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không chính xác'
            });
        }

        // Hash new password
        const newPasswordHash = await AuthUtils.hashPassword(new_password);

        // Update password
        await db.update('users', { password: newPasswordHash }, 'id = ?', [req.user.id]);

        // Revoke all sessions except current
        await db.query(
            'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND id != $2',
            [req.user.id, req.session.id]
        );

        // Log password change
        await auditLog({
            user_id: req.user.id,
            action: 'password_changed',
            table_name: 'users',
            record_id: req.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi mật khẩu'
        });
    }
});

// Get user sessions
router.get('/sessions', authenticate, async (req, res) => {
    try {
        const sessions = await SessionManager.getUserSessions(req.user.id);

        // Parse device info and add current session indicator
        const sessionsWithInfo = sessions.map(session => ({
            ...session,
            device_info: JSON.parse(session.device_info || '{}'),
            is_current: session.id === req.session.id
        }));

        res.json({
            success: true,
            data: { sessions: sessionsWithInfo }
        });

    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách phiên đăng nhập'
        });
    }
});

// Revoke specific session
router.delete('/sessions/:sessionId', authenticate, async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Check if session belongs to current user
        const session = await db.findOne(
            'SELECT id FROM user_sessions WHERE id = ? AND user_id = ?',
            [sessionId, req.user.id]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Phiên đăng nhập không tồn tại'
            });
        }

        // Revoke session
        await SessionManager.revokeSession(sessionId);

        res.json({
            success: true,
            message: 'Đã thu hồi phiên đăng nhập'
        });

    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi thu hồi phiên đăng nhập'
        });
    }
});

// Verify token (for client-side validation)
router.post('/verify', authenticate, (req, res) => {
    res.json({
        success: true,
        message: 'Token hợp lệ',
        data: {
            user: req.user,
            session: {
                id: req.session.id,
                expires_at: req.session.expires_at
            }
        }
    });
});

module.exports = router;