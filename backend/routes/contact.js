const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');

// Submit contact message (public)
router.post('/', ValidationRules.contactMessage, handleValidationErrors, async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Create contact message
        const messageId = await db.insert('contact_messages', {
            name,
            email,
            phone: phone || null,
            subject: subject || 'Liên hệ từ website',
            message,
            status: 'new',
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        // Create notification for admins
        await db.insert('notifications', {
            user_id: null, // Global notification for admins
            title: 'Tin nhắn liên hệ mới',
            message: `Có tin nhắn liên hệ mới từ ${name} (${email})`,
            type: 'system',
            priority: 'medium',
            action_url: `/admin/contact-messages/${messageId}`
        });

        res.status(201).json({
            success: true,
            message: 'Gửi tin nhắn thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.',
            data: { message_id: messageId }
        });

    } catch (error) {
        console.error('Submit contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi tin nhắn'
        });
    }
});

// Get all contact messages (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        let whereClause = '1=1';
        let params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (search) {
            whereClause += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const sql = `
            SELECT cm.*, 
             u.first_name as replied_by_first_name,
             u.last_name as replied_by_last_name
             FROM contact_messages cm
             LEFT JOIN users u ON cm.replied_by = u.id
             WHERE ${whereClause}
             ORDER BY cm.created_at DESC
        `;

        const result = await db.findMany(sql, params, parseInt(page), parseInt(limit));

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách tin nhắn'
        });
    }
});

// Get contact message details (admin only)
router.get('/:id', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        const message = await db.findOne(
            `SELECT cm.*, 
             u.first_name as replied_by_first_name,
             u.last_name as replied_by_last_name,
             u.email as replied_by_email
             FROM contact_messages cm
             LEFT JOIN users u ON cm.replied_by = u.id
             WHERE cm.id = ?`,
            [id]
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        // Mark as read if it's new
        if (message.status === 'new') {
            await db.update(
                'contact_messages',
                { status: 'read' },
                'id = ?',
                [id]
            );
            message.status = 'read';
        }

        res.json({
            success: true,
            data: { message }
        });

    } catch (error) {
        console.error('Get contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy tin nhắn'
        });
    }
});

// Reply to contact message (admin only)
router.post('/:id/reply', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { reply_message } = req.body;

        if (!reply_message || reply_message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung phản hồi là bắt buộc'
            });
        }

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        // Update message with reply
        await db.update(
            'contact_messages',
            {
                status: 'replied',
                replied_by: req.user.id,
                replied_at: new Date(),
                reply_message: reply_message.trim()
            },
            'id = ?',
            [id]
        );

        // Log reply
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'contact_message_replied',
            table_name: 'contact_messages',
            record_id: id,
            new_values: JSON.stringify({ reply_message }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        // TODO: Send email reply to the contact person
        // This would require email service integration

        res.json({
            success: true,
            message: 'Phản hồi tin nhắn thành công'
        });

    } catch (error) {
        console.error('Reply contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi phản hồi tin nhắn'
        });
    }
});

// Update contact message status (admin only)
router.put('/:id/status', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        // Update status
        await db.update(
            'contact_messages',
            { status },
            'id = ?',
            [id]
        );

        // Log status change
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'contact_message_status_updated',
            table_name: 'contact_messages',
            record_id: id,
            old_values: JSON.stringify({ status: message.status }),
            new_values: JSON.stringify({ status }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công'
        });

    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái'
        });
    }
});

// Delete contact message (admin only)
router.delete('/:id', authenticate, authorize('admin'), ValidationRules.idParam, handleValidationErrors, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [id]);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        // Delete message
        await db.delete('contact_messages', 'id = ?', [id]);

        // Log deletion
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'contact_message_deleted',
            table_name: 'contact_messages',
            record_id: id,
            old_values: JSON.stringify(message),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: 'Xóa tin nhắn thành công'
        });

    } catch (error) {
        console.error('Delete contact message error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa tin nhắn'
        });
    }
});

// Get contact message statistics (admin only)
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let whereClause = '1=1';
        let params = [];

        if (start_date) {
            whereClause += ' AND created_at >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND created_at <= ?';
            params.push(end_date);
        }

        const [
            overallStats,
            statusStats,
            dailyStats
        ] = await Promise.all([
            // Overall statistics
            db.query(
                `SELECT 
                 COUNT(*) as total_messages,
                 SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_messages,
                 SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_messages,
                 SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_messages,
                 SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_messages,
                 AVG(CASE WHEN replied_at IS NOT NULL 
                     THEN TIMESTAMPDIFF(HOUR, created_at, replied_at) 
                     ELSE NULL END) as avg_response_time_hours
                 FROM contact_messages WHERE ${whereClause}`,
                params
            ),

            // By status
            db.query(
                `SELECT status, COUNT(*) as count 
                 FROM contact_messages WHERE ${whereClause}
                 GROUP BY status`,
                params
            ),

            // Daily statistics
            db.query(
                `SELECT 
                 CAST(created_at AS DATE) as date,
                 COUNT(*) as total_messages,
                 SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_messages
                 FROM contact_messages WHERE ${whereClause}
                 GROUP BY CAST(created_at AS DATE)
                 ORDER BY date DESC
                 LIMIT 30`,
                params
            )
        ]);

        res.json({
            success: true,
            data: {
                overall: overallStats[0] || {},
                by_status: statusStats,
                daily_stats: dailyStats
            }
        });

    } catch (error) {
        console.error('Get contact stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thống kê tin nhắn'
        });
    }
});

// Bulk update contact messages (admin only)
router.put('/bulk/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { message_ids, status } = req.body;

        if (!Array.isArray(message_ids) || message_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách ID tin nhắn không hợp lệ'
            });
        }

        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Update messages
        const placeholders = message_ids.map(() => '?').join(',');
        const updatedCount = await db.query(
            `UPDATE contact_messages SET status = ? WHERE id IN (${placeholders})`,
            [status, ...message_ids]
        );

        // Log bulk update
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'contact_messages_bulk_update',
            table_name: 'contact_messages',
            new_values: JSON.stringify({ message_ids, status, updated_count: updatedCount.affectedRows }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });

        res.json({
            success: true,
            message: `Đã cập nhật ${updatedCount.affectedRows} tin nhắn`,
            data: { updated_count: updatedCount.affectedRows }
        });

    } catch (error) {
        console.error('Bulk update contact messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật hàng loạt'
        });
    }
});

module.exports = router;