const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// Admin dashboard stats - Only admin can access
router.get('/dashboard-stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Get user count
        let userCount = { count: 0 };
        try {
            userCount = await db.findOne('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        } catch (error) {
            console.log('Error getting user count:', error.message);
        }
        
        // Get class count (table might not exist)
        let classCount = { count: 0 };
        try {
            classCount = await db.findOne('SELECT COUNT(*) as count FROM classes WHERE status = ?', ['active']);
        } catch (error) {
            console.log('Error getting class count (table might not exist):', error.message);
        }
        
        // Get event count (table might not exist)
        let eventCount = { count: 0 };
        try {
            eventCount = await db.findOne('SELECT COUNT(*) as count FROM events WHERE date > CAST(GETDATE() AS DATE)');
        } catch (error) {
            console.log('Error getting event count (table might not exist):', error.message);
        }
        
        // Get recent registrations (last 30 days)
        let recentRegistrations = { count: 0 };
        try {
            recentRegistrations = await db.findOne(
                'SELECT COUNT(*) as count FROM users WHERE created_at > DATEADD(day, -30, GETDATE())'
            );
        } catch (error) {
            console.log('Error getting recent registrations:', error.message);
        }
        
        // Get membership status breakdown
        let membershipStats = [];
        try {
            membershipStats = await db.query(
                'SELECT membership_status, COUNT(*) as count FROM users WHERE is_active = 1 GROUP BY membership_status'
            );
        } catch (error) {
            console.log('Error getting membership stats:', error.message);
        }
        
        // Get recent activities (table might not exist)
        let recentActivities = [];
        try {
            recentActivities = await db.query(
                `SELECT TOP 10 
                    al.action, 
                    al.created_at, 
                    u.first_name, 
                    u.last_name, 
                    u.email
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 ORDER BY al.created_at DESC`
            );
        } catch (error) {
            console.log('Error getting recent activities (table might not exist):', error.message);
        }

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers: userCount?.count || 0,
                    totalClasses: classCount?.count || 0,
                    upcomingEvents: eventCount?.count || 0,
                    recentRegistrations: recentRegistrations?.count || 0
                },
                membershipStats: membershipStats || [],
                recentActivities: recentActivities || []
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê dashboard'
        });
    }
});

// Get all users - Admin only
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (search) {
            whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (role) {
            whereClause += ' AND role = ?';
            params.push(role);
        }

        if (status) {
            whereClause += ' AND membership_status = ?';
            params.push(status);
        }

        // Get total count
        const totalResult = await db.findOne(
            `SELECT COUNT(*) as total FROM users ${whereClause}`,
            params
        );
        const total = totalResult?.total || 0;

        // Get users with pagination
        const users = await db.query(
            `SELECT 
                id, email, username, first_name, last_name, 
                phone_number, role, membership_status, 
                is_active, created_at, last_login_at
             FROM users 
             ${whereClause}
             ORDER BY created_at DESC
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
            [...params, offset, parseInt(limit)]
        );

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
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

// Update user status - Admin only
router.patch('/users/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { membership_status, is_active } = req.body;

        const updateData = {};
        if (membership_status !== undefined) {
            updateData.membership_status = membership_status;
        }
        if (is_active !== undefined) {
            updateData.is_active = is_active;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có dữ liệu để cập nhật'
            });
        }

        await db.update('users', updateData, 'id = ?', [id]);

        // Log the action
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'user_status_updated',
            table_name: 'users',
            record_id: id,
            new_values: JSON.stringify(updateData),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái người dùng thành công'
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái người dùng'
        });
    }
});

// Update user profile by admin - Admin only
router.patch('/users/:id/profile', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            phone_number,
            date_of_birth,
            gender,
            address,
            belt_level,
            membership_status,
            notes
        } = req.body;

        // Check if user exists
        const user = await db.findOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (gender !== undefined) updateData.gender = gender;
        if (address !== undefined) updateData.address = address;
        if (belt_level !== undefined) updateData.belt_level = belt_level;
        if (membership_status !== undefined) updateData.membership_status = membership_status;
        if (notes !== undefined) updateData.notes = notes;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có dữ liệu để cập nhật'
            });
        }

        await db.update('users', updateData, 'id = ?', [id]);

        // Log the action
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'user_profile_updated_by_admin',
            table_name: 'users',
            record_id: id,
            old_values: JSON.stringify(user),
            new_values: JSON.stringify(updateData),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công'
        });

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin người dùng'
        });
    }
});

// Send notification to user - Admin only
router.post('/users/:id/notification', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, type = 'info', priority = 'medium' } = req.body;

        // Check if user exists
        const user = await db.findOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Create notification
        const notificationId = await db.insert('notifications', {
            user_id: id,
            title,
            message,
            type,
            priority,
            created_by: req.user.id,
            is_read: 0
        });

        // Log the action
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'notification_sent',
            table_name: 'notifications',
            record_id: notificationId,
            new_values: JSON.stringify({ title, message, type, priority, recipient: id }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Gửi thông báo thành công',
            data: { notificationId }
        });

    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi thông báo'
        });
    }
});

// Get user detailed profile - Admin only
router.get('/users/:id/profile', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Get user with detailed info
        const user = await db.findOne(
            `SELECT 
                u.*, 
                COUNT(DISTINCT c.id) as class_count,
                COUNT(DISTINCT a.id) as attendance_count,
                AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100 as attendance_rate
             FROM users u
             LEFT JOIN class_enrollments ce ON u.id = ce.user_id
             LEFT JOIN classes c ON ce.class_id = c.id
             LEFT JOIN attendance a ON u.id = a.user_id
             WHERE u.id = ?
             GROUP BY u.id`,
            [id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Get user's classes
        const classes = await db.query(
            `SELECT c.*, ce.enrolled_at, u_instructor.first_name as instructor_first_name, u_instructor.last_name as instructor_last_name
             FROM classes c
             JOIN class_enrollments ce ON c.id = ce.class_id
             LEFT JOIN users u_instructor ON c.instructor_id = u_instructor.id
             WHERE ce.user_id = ?`,
            [id]
        );

        // Get recent notifications
        const notifications = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [id]
        );

        res.json({
            success: true,
            data: {
                user,
                classes,
                notifications,
                stats: {
                    classCount: user.class_count || 0,
                    attendanceCount: user.attendance_count || 0,
                    attendanceRate: Math.round(user.attendance_rate || 0)
                }
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin người dùng'
        });
    }
});
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await db.findOne('SELECT * FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Don't allow deleting admin users
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Không thể xóa tài khoản quản trị viên'
            });
        }

        // Soft delete by setting is_active to 0
        await db.update('users', { is_active: 0 }, 'id = ?', [id]);

        // Log the action
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'user_deleted',
            table_name: 'users',
            record_id: id,
            old_values: JSON.stringify(user),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa người dùng'
        });
    }
});

// Get system logs - Admin only
router.get('/logs', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action = '', user_id = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        let params = [];

        if (action) {
            whereClause += ' AND action = ?';
            params.push(action);
        }

        if (user_id) {
            whereClause += ' AND user_id = ?';
            params.push(user_id);
        }

        // Get total count
        const totalResult = await db.findOne(
            `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
            params
        );
        const total = totalResult?.total || 0;

        // Get logs with user info
        const logs = await db.query(
            `SELECT 
                al.id, al.action, al.table_name, al.record_id,
                al.old_values, al.new_values, al.ip_address,
                al.created_at, u.first_name, u.last_name, u.email
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ${whereClause}
             ORDER BY al.created_at DESC
             OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
            [...params, offset, parseInt(limit)]
        );

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy nhật ký hệ thống'
        });
    }
});

module.exports = router;


// Get recent new users
router.get('/users/recent', authenticate, authorize('admin'), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent users with proper MSSQL syntax
        const query = `
            SELECT TOP ${limit}
                id, email, username, first_name, last_name, full_name,
                phone_number, role, membership_status, is_active,
                email_verified, created_at, last_login_at
            FROM users
            ORDER BY created_at DESC
        `;
        
        const users = await db.query(query);

        res.json({
            success: true,
            data: {
                users: users,
                count: users.length
            }
        });

    } catch (error) {
        console.error('Error getting recent users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách user mới'
        });
    }
});

// Approve user (change membership status to active)
router.post('/users/:id/approve', authenticate, authorize('admin'), async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const user = await db.findOne('SELECT id, email, full_name FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy user'
            });
        }

        // Update membership status
        await db.update('users', 
            { membership_status: 'active' },
            'id = ?',
            [userId]
        );

        // Log action
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'user_approved',
            table_name: 'users',
            record_id: userId,
            new_values: JSON.stringify({ membership_status: 'active' }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        // Send notification to user
        const NotificationService = require('../services/notificationService');
        await NotificationService.notifyUser(
            userId,
            'system',
            'high',
            '🎉 Tài khoản đã được phê duyệt',
            `Chúc mừng! Tài khoản của bạn đã được phê duyệt và kích hoạt.\n\nBạn có thể bắt đầu đăng ký lớp học và tham gia các hoạt động của CLB.`,
            { action: 'account_approved' }
        );

        res.json({
            success: true,
            message: 'Đã phê duyệt thành viên thành công'
        });

    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phê duyệt thành viên'
        });
    }
});
