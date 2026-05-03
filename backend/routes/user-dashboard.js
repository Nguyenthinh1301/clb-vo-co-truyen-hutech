/**
 * User Dashboard API Routes
 * API cho thành viên thường xem thông tin của mình
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/user/profile
 * Lấy thông tin cá nhân của user đang đăng nhập
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const users = await db.query(`
            SELECT 
                id,
                email,
                username,
                first_name,
                last_name,
                full_name,
                phone_number,
                date_of_birth,
                gender,
                address,
                avatar,
                role,
                membership_status,
                belt_level,
                created_at
            FROM users
            WHERE id = ? AND is_active = 1
        `, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin cá nhân',
            error: error.message
        });
    }
});

/**
 * GET /api/user/classes
 * Lấy danh sách lớp học mà user đã đăng ký
 */
router.get('/classes', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const classes = await db.query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.schedule,
                c.location,
                c.status,
                c.start_date,
                c.end_date,
                u.full_name as instructor_name,
                ce.status as enrollment_status,
                ce.enrolled_at
            FROM class_enrollments ce
            INNER JOIN classes c ON ce.class_id = c.id
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE ce.user_id = ? AND ce.status = 'active'
            ORDER BY ce.enrolled_at DESC
        `, [userId]);
        
        res.json({
            success: true,
            data: classes
        });
    } catch (error) {
        console.error('Error fetching user classes:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách lớp học',
            error: error.message
        });
    }
});

/**
 * GET /api/user/events
 * Lấy danh sách sự kiện sắp tới
 */
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get upcoming events - use current date as parameter to avoid SQL parsing issues
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const events = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.description,
                e.type,
                e.location,
                e.date,
                e.start_time,
                e.end_time,
                e.max_participants,
                e.current_participants,
                e.status,
                e.image,
                CASE 
                    WHEN er.id IS NOT NULL THEN 1
                    ELSE 0
                END as is_registered,
                er.status as registration_status
            FROM events e
            LEFT JOIN event_registrations er ON e.id = er.event_id AND er.user_id = ?
            WHERE e.date >= ? AND e.status IN ('upcoming', 'ongoing')
            ORDER BY e.date ASC, e.start_time ASC
        `, [userId, today]);
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sự kiện',
            error: error.message
        });
    }
});

/**
 * GET /api/user/schedule
 * Lấy lịch tập của user
 */
router.get('/schedule', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { month, year } = req.query;
        
        // Get attendance records
        const dbType = process.env.DB_TYPE || 'mysql';
        let dateFilter = '';
        let params = [userId];
        
        if (month && year) {
            if (dbType === 'mssql') {
                dateFilter = 'AND MONTH(a.date) = ? AND YEAR(a.date) = ?';
            } else {
                dateFilter = 'AND MONTH(a.date) = ? AND YEAR(a.date) = ?';
            }
            params.push(parseInt(month), parseInt(year));
        }
        
        const schedule = await db.query(`
            SELECT 
                a.id,
                a.date,
                a.status,
                a.notes,
                c.name as class_name,
                c.schedule as class_schedule,
                c.location
            FROM attendance a
            INNER JOIN classes c ON a.class_id = c.id
            WHERE a.user_id = ? ${dateFilter}
            ORDER BY a.date DESC
        `, params);
        
        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        console.error('Error fetching user schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch tập',
            error: error.message
        });
    }
});

/**
 * GET /api/user/notifications
 * Lấy thông báo của user
 */
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;
        
        const notifications = await db.query(`
            SELECT 
                id,
                title,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), parseInt(offset)]);
        
        // Get unread count
        const unreadCount = await db.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        `, [userId]);
        
        res.json({
            success: true,
            data: {
                notifications,
                unreadCount: unreadCount[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo',
            error: error.message
        });
    }
});

/**
 * PUT /api/user/notifications/:id/read
 * Đánh dấu thông báo đã đọc
 */
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        
        // Check if notification belongs to user
        const notification = await db.query(
            'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
        
        if (notification.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }
        
        await db.update(
            'notifications',
            { is_read: 1 },
            'id = ?',
            [notificationId]
        );
        
        res.json({
            success: true,
            message: 'Đã đánh dấu đọc thông báo'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông báo',
            error: error.message
        });
    }
});

/**
 * GET /api/user/stats
 * Lấy thống kê tổng quan của user
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Count enrolled classes
        const classCount = await db.query(`
            SELECT COUNT(*) as count
            FROM class_enrollments
            WHERE user_id = ? AND status = 'active'
        `, [userId]);
        
        // Count upcoming events - use current date as parameter
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const eventCount = await db.query(`
            SELECT COUNT(*) as count
            FROM events e
            WHERE e.date >= ? AND e.status IN ('upcoming', 'ongoing')
        `, [today]);
        
        // Count unread notifications
        const notificationCount = await db.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = ? AND is_read = 0
        `, [userId]);
        
        // Get attendance stats
        const attendanceStats = await db.query(`
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count
            FROM attendance
            WHERE user_id = ?
        `, [userId]);
        
        res.json({
            success: true,
            data: {
                classCount: classCount[0]?.count || 0,
                upcomingEventCount: eventCount[0]?.count || 0,
                unreadNotificationCount: notificationCount[0]?.count || 0,
                attendance: attendanceStats[0] || {
                    total_sessions: 0,
                    present_count: 0,
                    absent_count: 0,
                    late_count: 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: error.message
        });
    }
});

module.exports = router;
