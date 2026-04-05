/**
 * Admin Notifications Routes
 * API để admin gửi thông báo đến users
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Send notification to users
 * POST /api/admin/notifications/send
 */
router.post('/send', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { recipients, type, priority, title, message } = req.body;
        
        // Validation
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn người nhận'
            });
        }
        
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập đầy đủ tiêu đề và nội dung'
            });
        }
        
        // Validate and convert type to allowed values
        const validTypes = ['info', 'success', 'warning', 'error'];
        let notificationType = 'info';
        
        if (validTypes.includes(type)) {
            notificationType = type;
        } else {
            const typeMap = {
                'general': 'info',
                'class': 'info',
                'event': 'info',
                'system': 'info',
                'urgent': 'error'
            };
            notificationType = typeMap[type] || 'info';
        }
        
        // Create notifications for each recipient
        const notificationPromises = recipients.map(userId => {
            return db.insert('notifications', {
                user_id: userId,
                type: notificationType,
                title: title,
                message: message,
                is_read: 0
            });
        });
        
        await Promise.all(notificationPromises);
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'send_notification',
            table_name: 'notifications',
            new_values: JSON.stringify({
                recipient_count: recipients.length,
                type: notificationType,
                title
            }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: `Đã gửi thông báo đến ${recipients.length} người`,
            data: {
                recipientCount: recipients.length
            }
        });
        
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi thông báo'
        });
    }
});

/**
 * Get notification history
 * GET /api/admin/notifications/history
 */
router.get('/history', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        // Get recent notifications grouped by title and message
        const dbType = process.env.DB_TYPE || 'mysql';
        let query;
        
        if (dbType === 'mssql') {
            query = `
                SELECT 
                    MIN(id) as id,
                    type,
                    title,
                    message,
                    MIN(created_at) as created_at,
                    COUNT(*) as recipient_count
                FROM notifications
                GROUP BY type, title, message
                ORDER BY MIN(created_at) DESC
                OFFSET @param0 ROWS FETCH NEXT @param1 ROWS ONLY
            `;
        } else {
            query = `
                SELECT 
                    MIN(id) as id,
                    type,
                    title,
                    message,
                    MIN(created_at) as created_at,
                    COUNT(*) as recipient_count
                FROM notifications
                GROUP BY type, title, message
                ORDER BY MIN(created_at) DESC
                LIMIT ? OFFSET ?
            `;
        }
        
        const notifications = await db.query(query, [parseInt(limit), offset]);
        
        res.json({
            success: true,
            data: notifications || []
        });
        
    } catch (error) {
        console.error('Get notification history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy lịch sử thông báo'
        });
    }
});

/**
 * Get notification statistics
 * GET /api/admin/notifications/stats
 */
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
    try {
        // Total notifications
        const totalResult = await db.findOne(
            'SELECT COUNT(*) as total FROM notifications'
        );
        
        // Unread notifications
        const unreadResult = await db.findOne(
            'SELECT COUNT(*) as total FROM notifications WHERE is_read = 0'
        );
        
        // Notifications by type
        const byTypeResult = await db.query(
            `SELECT type, COUNT(*) as count 
             FROM notifications 
             GROUP BY type`
        );
        
        res.json({
            success: true,
            data: {
                totalSent: totalResult?.total || 0,
                unread: unreadResult?.total || 0,
                byType: byTypeResult || []
            }
        });
        
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê thông báo'
        });
    }
});

/**
 * Delete notification
 * DELETE /api/admin/notifications/:id
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if notification exists
        const notification = await db.findOne(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Thông báo không tồn tại'
            });
        }
        
        // Delete notification
        await db.delete('notifications', { id: id });
        
        res.json({
            success: true,
            message: 'Đã xóa thông báo'
        });
        
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa thông báo'
        });
    }
});

module.exports = router;
