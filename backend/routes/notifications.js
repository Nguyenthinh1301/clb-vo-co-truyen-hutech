const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Get user's notifications
router.get('/my-notifications', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, unread_only = false } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE user_id = ?';
        let params = [req.user.id];

        if (unread_only === 'true') {
            whereClause += ' AND is_read = 0';
        }

        // Get total count
        const totalResult = await db.findOne(
            `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
            params
        );
        const total = totalResult?.total || 0;

        // Get notifications with pagination
        const notifications = await db.query(
            `SELECT 
                n.*,
                u.first_name as sender_first_name,
                u.last_name as sender_last_name
             FROM notifications n
             LEFT JOIN users u ON n.created_by = u.id
             ${whereClause}
             ORDER BY n.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), offset]
        );

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông báo'
        });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if notification belongs to current user
        const notification = await db.findOne(
            'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Thông báo không tồn tại'
            });
        }

        // Mark as read
        await db.update('notifications', { is_read: 1 }, 'id = ?', [id]);

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

// Mark all notifications as read
router.patch('/mark-all-read', authenticate, async (req, res) => {
    try {
        await db.update(
            'notifications', 
            { is_read: 1 }, 
            'user_id = ? AND is_read = 0', 
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'Đã đánh dấu tất cả thông báo là đã đọc'
        });

    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông báo'
        });
    }
});

// Get unread notification count
router.get('/unread-count', authenticate, async (req, res) => {
    try {
        const result = await db.findOne(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [req.user.id]
        );

        res.json({
            success: true,
            data: {
                unreadCount: result?.count || 0
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy số thông báo chưa đọc'
        });
    }
});

module.exports = router;