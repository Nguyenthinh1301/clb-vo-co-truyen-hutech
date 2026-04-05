const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE is_active = 1';
        let params = [];

        if (search) {
            whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR username LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const users = await db.find(
            `SELECT id, email, username, first_name, last_name, role, 
             membership_status, created_at
             FROM users ${whereClause} 
             ORDER BY created_at DESC`,
            params
        );

        // Get total count
        const totalResult = await db.findOne(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        const total = totalResult ? totalResult.total : 0;

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách người dùng'
        });
    }
});

// Get user profile (public info)
router.get('/:id', ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await db.findOne(
            `SELECT id, username, first_name, last_name, profile_image, 
             role, belt_level, join_date 
             FROM users WHERE id = ? AND is_active = 1`,
            [id]
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
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin người dùng'
        });
    }
});

// Update user profile
router.put('/profile', authenticate, ValidationRules.userUpdate, handleValidationErrors, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            phone_number,
            date_of_birth,
            gender,
            address,
            emergency_contact,
            medical_info
        } = req.body;

        // Get current user data for audit log
        const currentUser = await db.findOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

        // Prepare update data
        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (gender !== undefined) updateData.gender = gender;
        if (address !== undefined) updateData.address = address;
        if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;
        if (medical_info !== undefined) updateData.medical_info = medical_info;

        // Update user
        await db.update('users', updateData, 'id = ?', [req.user.id]);

        // Get updated user
        const updatedUser = await db.findOne(
            `SELECT id, email, username, first_name, last_name, phone_number, 
             date_of_birth, gender, address, emergency_contact, medical_info,
             profile_image, role, membership_status, belt_level, join_date 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        // Log profile update
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'profile_updated',
            table_name: 'users',
            record_id: req.user.id,
            old_values: JSON.stringify(currentUser),
            new_values: JSON.stringify(updatedUser),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin'
        });
    }
});

// Get user's classes
router.get('/profile/classes', authenticate, async (req, res) => {
    try {
        const classes = await db.query(
            `SELECT c.*, ce.enrollment_date, ce.status as enrollment_status, 
             ce.payment_status, u.first_name as instructor_first_name, 
             u.last_name as instructor_last_name
             FROM class_enrollments ce
             JOIN classes c ON ce.class_id = c.id
             JOIN users u ON c.instructor_id = u.id
             WHERE ce.user_id = ?
             ORDER BY ce.enrollment_date DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: classes
        });

    } catch (error) {
        console.error('Get user classes error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách lớp học'
        });
    }
});

// Create new user (admin only)
router.post('/', authenticate, authorize('admin'), ValidationRules.userRegistration, handleValidationErrors, async (req, res) => {
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
            address,
            role = 'student'
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
        const { AuthUtils } = require('../middleware/auth');
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
            role,
            membership_status: 'pending'
        });

        // Get created user (without password)
        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, role, membership_status, created_at FROM users WHERE id = ?',
            [userId]
        );

        // Log user creation
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'user_created_by_admin',
            table_name: 'users',
            record_id: userId,
            new_values: JSON.stringify({ email, username, role }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.status(201).json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: { user }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo người dùng'
        });
    }
});

// Get user's events
router.get('/profile/events', authenticate, async (req, res) => {
    try {
        const events = await db.query(
            `SELECT e.*, er.registration_date, er.status as registration_status, 
             er.payment_status
             FROM event_registrations er
             JOIN events e ON er.event_id = e.id
             WHERE er.user_id = ?
             ORDER BY e.start_date DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: { events }
        });

    } catch (error) {
        console.error('Get user events error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sự kiện'
        });
    }
});

// Get user's attendance
router.get('/profile/attendance', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, class_id } = req.query;

        let whereClause = 'a.user_id = ?';
        let params = [req.user.id];

        if (class_id) {
            whereClause += ' AND a.class_id = ?';
            params.push(class_id);
        }

        const sql = `
            SELECT a.*, c.name as class_name, c.schedule,
             u.first_name as recorded_by_first_name, 
             u.last_name as recorded_by_last_name
             FROM attendance a
             JOIN classes c ON a.class_id = c.id
             JOIN users u ON a.recorded_by = u.id
             WHERE ${whereClause}
             ORDER BY a.date DESC
        `;

        const result = await db.findMany(sql, params, parseInt(page), parseInt(limit));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử điểm danh'
        });
    }
});

// Get user's achievements/promotions
router.get('/profile/promotions', authenticate, async (req, res) => {
    try {
        const promotions = await db.query(
            `SELECT bp.*, u.first_name as promoted_by_first_name, 
             u.last_name as promoted_by_last_name
             FROM belt_promotions bp
             JOIN users u ON bp.promoted_by = u.id
             WHERE bp.user_id = ?
             ORDER BY bp.promotion_date DESC`,
            [req.user.id]
        );

        res.json({
            success: true,
            data: { promotions }
        });

    } catch (error) {
        console.error('Get user promotions error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử thăng cấp'
        });
    }
});

// Get user's notifications
router.get('/profile/notifications', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, unread_only = false } = req.query;

        let whereClause = 'user_id = ? OR user_id IS NULL';
        let params = [req.user.id];

        if (unread_only === 'true') {
            whereClause += ' AND is_read = 0';
        }

        const sql = `
            SELECT * FROM notifications 
            WHERE ${whereClause}
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY created_at DESC
        `;

        const result = await db.findMany(sql, params, parseInt(page), parseInt(limit));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông báo'
        });
    }
});

// Mark notification as read
router.put('/profile/notifications/:id/read', authenticate, ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if notification belongs to user or is global
        const notification = await db.findOne(
            'SELECT * FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
            [id, req.user.id]
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Thông báo không tồn tại'
            });
        }

        // Mark as read
        await db.update(
            'notifications',
            { is_read: 1, read_at: new Date() },
            'id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu thông báo là đã đọc'
        });

    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông báo'
        });
    }
});

// Get user's payment history
router.get('/profile/payments', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const sql = `
            SELECT p.*, 
             CASE 
                WHEN p.reference_type = 'class_enrollment' THEN c.name
                WHEN p.reference_type = 'event_registration' THEN e.title
                ELSE 'Khác'
             END as reference_name
             FROM payments p
             LEFT JOIN classes c ON p.reference_type = 'class_enrollment' AND p.reference_id = c.id
             LEFT JOIN events e ON p.reference_type = 'event_registration' AND p.reference_id = e.id
             WHERE p.user_id = ?
             ORDER BY p.created_at DESC
        `;

        const result = await db.findMany(sql, [req.user.id], parseInt(page), parseInt(limit));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get user payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử thanh toán'
        });
    }
});

// Get user statistics
router.get('/profile/stats', authenticate, async (req, res) => {
    try {
        // Get various statistics
        const [
            classStats,
            eventStats,
            attendanceStats,
            promotionStats
        ] = await Promise.all([
            // Class statistics
            db.query(
                `SELECT 
                 COUNT(*) as total_classes,
                 SUM(CASE WHEN ce.status = 'enrolled' THEN 1 ELSE 0 END) as active_classes,
                 SUM(CASE WHEN ce.status = 'completed' THEN 1 ELSE 0 END) as completed_classes
                 FROM class_enrollments ce WHERE ce.user_id = ?`,
                [req.user.id]
            ),
            
            // Event statistics
            db.query(
                `SELECT 
                 COUNT(*) as total_events,
                 SUM(CASE WHEN er.status = 'registered' THEN 1 ELSE 0 END) as registered_events,
                 SUM(CASE WHEN er.status = 'attended' THEN 1 ELSE 0 END) as attended_events
                 FROM event_registrations er WHERE er.user_id = ?`,
                [req.user.id]
            ),
            
            // Attendance statistics
            db.query(
                `SELECT 
                 COUNT(*) as total_sessions,
                 SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_sessions,
                 SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_sessions,
                 SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_sessions
                 FROM attendance WHERE user_id = ?`,
                [req.user.id]
            ),
            
            // Promotion statistics
            db.query(
                'SELECT COUNT(*) as total_promotions FROM belt_promotions WHERE user_id = ?',
                [req.user.id]
            )
        ]);

        const stats = {
            classes: classStats[0] || { total_classes: 0, active_classes: 0, completed_classes: 0 },
            events: eventStats[0] || { total_events: 0, registered_events: 0, attended_events: 0 },
            attendance: attendanceStats[0] || { total_sessions: 0, present_sessions: 0, late_sessions: 0, absent_sessions: 0 },
            promotions: promotionStats[0] || { total_promotions: 0 }
        };

        // Calculate attendance rate
        if (stats.attendance.total_sessions > 0) {
            stats.attendance.attendance_rate = Math.round(
                (stats.attendance.present_sessions / stats.attendance.total_sessions) * 100
            );
        } else {
            stats.attendance.attendance_rate = 0;
        }

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê'
        });
    }
});

module.exports = router;