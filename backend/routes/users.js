const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auditLog = require('../utils/auditLog');
const { authenticate, authorize, AuthUtils } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors, parsePagination } = require('../middleware/validation');
const { cacheService } = require('../services/cacheService');
const logger = require('../services/loggerService');

// Cache TTL cho users (giây) — ngắn hơn CMS vì dữ liệu thay đổi thường xuyên hơn
const USER_CACHE_TTL = 30; // 30 giây

// Xóa cache users khi có thay đổi
function invalidateUserCache() {
    cacheService.deletePattern('^users:list');
}

// ════════════════════════════════════════════════════════════
// ADMIN — Danh sách thành viên
// GET /api/users?page=&limit=&search=&role=&status=
// ════════════════════════════════════════════════════════════
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 20, 100);
        const { search = '', role = '', status = '' } = req.query;

        // Cache key theo tất cả params
        const cacheKey = `users:list:${page}:${limit}:${search}:${role}:${status}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        let where  = 'WHERE 1=1';
        let params = [];

        if (search) {
            where += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR username LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }
        if (role)   { where += ' AND role = ?';              params.push(role); }
        if (status) { where += ' AND membership_status = ?'; params.push(status); }

        const users = await db.find(
            `SELECT id, email, username, first_name, last_name, full_name,
             phone_number, role, membership_status, is_active, belt_level,
             created_at, last_login_at
             FROM users ${where}
             ORDER BY created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        const totalResult = await db.findOne(
            `SELECT COUNT(*) as total FROM users ${where}`, params
        );
        const total = totalResult ? (totalResult.total || 0) : 0;

        const result = {
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        };
        cacheService.set(cacheKey, result, USER_CACHE_TTL);
        res.json(result);
    } catch (error) {
        logger.error('Get users error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách người dùng' });
    }
});

// ════════════════════════════════════════════════════════════
// ADMIN — Tạo user mới
// POST /api/users
// ════════════════════════════════════════════════════════════
router.post('/', authenticate, authorize('admin'), ValidationRules.userRegistration, handleValidationErrors, async (req, res) => {
    try {
        const {
            email, username, password,
            first_name, last_name,
            phone_number, date_of_birth, gender, address,
            role = 'student'
        } = req.body;

        const existingEmail = await db.findOne('SELECT id FROM users WHERE email = ?', [email]);
        if (existingEmail) return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });

        const existingUsername = await db.findOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUsername) return res.status(409).json({ success: false, message: 'Username đã được sử dụng' });

        const passwordHash = await AuthUtils.hashPassword(password);

        const userId = await db.insert('users', {
            email, username,
            password:     passwordHash,
            first_name,
            last_name:    last_name || '',
            full_name:    `${first_name} ${last_name || ''}`.trim(),
            phone_number: phone_number  || null,
            date_of_birth: date_of_birth || null,
            gender:       gender        || null,
            address:      address       || null,
            role,
            membership_status: 'pending',
            is_active: 1
        });

        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, role, membership_status, created_at FROM users WHERE id = ?',
            [userId]
        );

        try {
            await auditLog({
                user_id:    req.user.id,
                action:     'user_created_by_admin',
                table_name: 'users',
                record_id:  userId,
                new_values: JSON.stringify({ email, username, role }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { logger.warn('Audit log warning:', { error: logErr.message }); }

        res.status(201).json({ success: true, message: 'Tạo người dùng thành công', data: { user } });

    } catch (error) {
        logger.error('Create user error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo người dùng' });
    }
});

// ════════════════════════════════════════════════════════════
// PROFILE — Các route /profile/* phải đặt TRƯỚC /:id
// ════════════════════════════════════════════════════════════

// GET /api/users/profile/me  (alias)
router.get('/profile/me', authenticate, async (req, res) => {
    try {
        const user = await db.findOne(
            `SELECT id, email, username, first_name, last_name, phone_number,
             date_of_birth, gender, address, profile_image, role,
             membership_status, belt_level, join_date, last_login_at,
             email_verified, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );
        if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        res.json({ success: true, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT /api/users/profile  — cập nhật thông tin cá nhân
router.put('/profile', authenticate, ValidationRules.userUpdate, handleValidationErrors, async (req, res) => {
    try {
        const { first_name, last_name, phone_number, date_of_birth, gender, address, emergency_contact, medical_info } = req.body;

        const currentUser = await db.findOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

        const upd = {};
        if (first_name        !== undefined) upd.first_name        = first_name;
        if (last_name         !== undefined) upd.last_name         = last_name;
        if (phone_number      !== undefined) upd.phone_number      = phone_number;
        if (date_of_birth     !== undefined) upd.date_of_birth     = date_of_birth;
        if (gender            !== undefined) upd.gender            = gender;
        if (address           !== undefined) upd.address           = address;
        if (emergency_contact !== undefined) upd.emergency_contact = emergency_contact;
        if (medical_info      !== undefined) upd.medical_info      = medical_info;

        await db.update('users', upd, 'id = ?', [req.user.id]);

        const updatedUser = await db.findOne(
            `SELECT id, email, username, first_name, last_name, phone_number,
             date_of_birth, gender, address, emergency_contact, medical_info,
             profile_image, role, membership_status, belt_level, join_date
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        try {
            await auditLog({
                user_id:    req.user.id,
                action:     'profile_updated',
                table_name: 'users',
                record_id:  req.user.id,
                old_values: JSON.stringify(currentUser),
                new_values: JSON.stringify(updatedUser),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { logger.warn('Audit log warning:', { error: logErr.message }); }

        res.json({ success: true, message: 'Cập nhật thông tin thành công', data: { user: updatedUser } });
    } catch (error) {
        logger.error('Update profile error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thông tin' });
    }
});

// GET /api/users/profile/classes
router.get('/profile/classes', authenticate, async (req, res) => {
    try {
        const classes = await db.find(
            `SELECT c.*, ce.enrollment_date, ce.status as enrollment_status,
             ce.payment_status, u.first_name as instructor_first_name,
             u.last_name as instructor_last_name
             FROM class_enrollments ce
             JOIN classes c ON ce.class_id = c.id
             LEFT JOIN users u ON c.instructor_id = u.id
             WHERE ce.user_id = ?
             ORDER BY ce.enrollment_date DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: classes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách lớp học' });
    }
});

// GET /api/users/profile/events
router.get('/profile/events', authenticate, async (req, res) => {
    try {
        const events = await db.find(
            `SELECT e.*, er.registered_at, er.status as registration_status
             FROM event_registrations er
             JOIN events e ON er.event_id = e.id
             WHERE er.user_id = ?
             ORDER BY e.date DESC`,
            [req.user.id]
        );
        res.json({ success: true, data: { events } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách sự kiện' });
    }
});

// GET /api/users/profile/notifications
router.get('/profile/notifications', authenticate, async (req, res) => {
    try {
        const { unread_only = false } = req.query;
        let where  = '(user_id = ? OR user_id IS NULL)';
        let params = [req.user.id];
        if (unread_only === 'true') { where += ' AND is_read = 0'; }

        const notifications = await db.find(
            `SELECT * FROM notifications WHERE ${where}
             AND (expires_at IS NULL OR expires_at > GETDATE())
             ORDER BY created_at DESC`,
            params
        );
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông báo' });
    }
});

// PUT /api/users/profile/notifications/:id/read
router.put('/profile/notifications/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await db.findOne(
            'SELECT id FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [id, req.user.id]
        );
        if (!notification) return res.status(404).json({ success: false, message: 'Thông báo không tồn tại' });
        await db.update('notifications', { is_read: 1, read_at: new Date() }, 'id = ?', [id]);
        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thông báo' });
    }
});

// ════════════════════════════════════════════════════════════
// ADMIN — Cập nhật user theo ID
// PUT /api/users/:id
// ════════════════════════════════════════════════════════════
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const { role, membership_status, is_active, belt_level, first_name, last_name, phone_number, notes } = req.body;

        const existing = await db.findOne('SELECT id, email FROM users WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

        const upd = { updated_at: new Date() };
        if (role              !== undefined) upd.role              = role;
        if (membership_status !== undefined) upd.membership_status = membership_status;
        if (is_active         !== undefined) upd.is_active         = is_active ? 1 : 0;
        if (belt_level        !== undefined) upd.belt_level        = belt_level;
        if (first_name        !== undefined) upd.first_name        = first_name;
        if (last_name         !== undefined) upd.last_name         = last_name;
        if (phone_number      !== undefined) upd.phone_number      = phone_number;
        if (notes             !== undefined) upd.notes             = notes;

        // Cập nhật full_name nếu có thay đổi tên
        if (first_name !== undefined || last_name !== undefined) {
            const fn = first_name !== undefined ? first_name : (existing.first_name || '');
            const ln = last_name  !== undefined ? last_name  : (existing.last_name  || '');
            upd.full_name = `${fn} ${ln}`.trim();
        }

        await db.update('users', upd, 'id = ?', [numId]);
        invalidateUserCache();

        try {
            await auditLog({
                user_id:    req.user.id,
                action:     'user_updated_by_admin',
                table_name: 'users',
                record_id:  numId,
                new_values: JSON.stringify(upd),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { logger.warn('Audit log warning:', { error: logErr.message }); }

        res.json({ success: true, message: 'Cập nhật thành viên thành công' });
    } catch (error) {
        logger.error('Update user error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật thành viên' });
    }
});

// ════════════════════════════════════════════════════════════
// ADMIN — Khóa / Mở khóa user
// DELETE /api/users/:id  (toggle is_active)
// ════════════════════════════════════════════════════════════
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        if (numId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản của chính mình' });
        }

        const existing = await db.findOne('SELECT id, is_active, role FROM users WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

        if (existing.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể khóa tài khoản Admin' });
        }

        const newActive = existing.is_active ? 0 : 1;
        await db.update('users', { is_active: newActive, updated_at: new Date() }, 'id = ?', [numId]);
        invalidateUserCache();

        // Khi khóa tài khoản → revoke tất cả sessions ngay lập tức
        // Token JWT sẽ bị từ chối ở middleware authenticate (check is_active = 1)
        if (!newActive) {
            await db.update('user_sessions', { is_active: 0 }, 'user_id = ?', [numId]);
        }

        try {
            await auditLog({
                user_id:    req.user.id,
                action:     newActive ? 'user_unlocked' : 'user_locked',
                table_name: 'users',
                record_id:  numId,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { logger.warn('Audit log warning:', { error: logErr.message }); }

        res.json({
            success: true,
            message: newActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
            data: { is_active: newActive }
        });
    } catch (error) {
        logger.error('Toggle user error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái' });
    }
});

// ════════════════════════════════════════════════════════════
// ADMIN — Xóa hẳn user
// DELETE /api/users/:id/delete
// ════════════════════════════════════════════════════════════
router.delete('/:id/delete', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        if (numId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình' });
        }

        const existing = await db.findOne('SELECT id, email, role, first_name, last_name FROM users WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

        if (existing.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản Admin' });
        }

        // Xóa sessions trước (tránh FK constraint)
        await db.delete('user_sessions', 'user_id = ?', [numId]);

        // Xóa user
        await db.delete('users', 'id = ?', [numId]);
        invalidateUserCache();

        try {
            await auditLog({
                user_id:    req.user.id,
                action:     'user_deleted_by_admin',
                table_name: 'users',
                record_id:  numId,
                old_values: JSON.stringify({ email: existing.email, role: existing.role }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { logger.warn('Audit log warning:', { error: logErr.message }); }

        res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
    } catch (error) {
        logger.error('Delete user error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa tài khoản' });
    }
});

// ════════════════════════════════════════════════════════════
// PUBLIC — Xem profile user theo ID
// GET /api/users/:id
// ════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const user = await db.findOne(
            `SELECT id, username, first_name, last_name, full_name,
             profile_image, role, belt_level, join_date
             FROM users WHERE id = ? AND is_active = 1`,
            [numId]
        );
        if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        res.json({ success: true, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin người dùng' });
    }
});

module.exports = router;
