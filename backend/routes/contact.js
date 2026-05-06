const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auditLog = require('../utils/auditLog');
const { authenticate, authorize } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors, parsePagination } = require('../middleware/validation');
const emailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');
const logger = require('../services/loggerService');

// Rate limiter riêng cho form liên hệ public
// Giới hạn: 5 lần gửi / 15 phút / IP — ngăn spam
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: process.env.NODE_ENV === 'development' ? 50 : 5,
    message: {
        success: false,
        message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip // giới hạn theo IP
});

// Submit contact message (public) — rate limited: 5 lần/15 phút/IP
router.post('/', contactLimiter, ValidationRules.contactMessage, handleValidationErrors, async (req, res) => {
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
        logger.error('Submit contact message error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi tin nhắn'
        });
    }
});

// Get all contact messages (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 20, 100);
        const { status, search } = req.query;

        let whereClause = '1=1';
        let params = [];

        if (status) {
            whereClause += ' AND cm.status = ?';
            params.push(status);
        }
        if (search) {
            whereClause += ' AND (cm.name LIKE ? OR cm.email LIKE ? OR cm.subject LIKE ? OR cm.message LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s);
        }

        const rows = await db.find(
            `SELECT cm.id, cm.name, cm.email, cm.phone, cm.subject, cm.message,
             cm.status, cm.replied_at, cm.reply_message, cm.created_at,
             u.first_name as replied_by_first_name, u.last_name as replied_by_last_name
             FROM contact_messages cm
             LEFT JOIN users u ON cm.replied_by = u.id
             WHERE ${whereClause}
             ORDER BY cm.created_at DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        const total = await db.findOne(
            `SELECT COUNT(*) as cnt FROM contact_messages cm WHERE ${whereClause}`, params
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: total ? (total.cnt || 0) : 0,
                pages: Math.ceil((total ? total.cnt || 0 : 0) / limit)
            }
        });
    } catch (error) {
        logger.error('Get contact messages error:', { error: error.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách tin nhắn' });
    }
});

// Get contact message details (admin only)
router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }

        const message = await db.findOne(
            `SELECT cm.*, 
             u.first_name as replied_by_first_name,
             u.last_name as replied_by_last_name,
             u.email as replied_by_email
             FROM contact_messages cm
             LEFT JOIN users u ON cm.replied_by = u.id
             WHERE cm.id = ?`,
            [numId]
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
                [numId]
            );
            message.status = 'read';
        }

        res.json({
            success: true,
            data: { message }
        });

    } catch (error) {
        logger.error('Get contact message error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy tin nhắn'
        });
    }
});

// Reply to contact message (admin only)
router.post('/:id/reply', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }
        const { reply_message, reply_to_email } = req.body;

        if (!reply_message || reply_message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung phản hồi là bắt buộc'
            });
        }

        // Validate reply_to_email nếu được cung cấp
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (reply_to_email && !emailRegex.test(reply_to_email)) {
            return res.status(400).json({
                success: false,
                message: 'Email người nhận không hợp lệ'
            });
        }

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [numId]);
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
            [numId]
        );

        // Log reply
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'contact_message_replied',
                table_name: 'contact_messages',
                record_id: numId,
                new_values: JSON.stringify({ reply_message }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) {
            logger.warn('Audit log warning (non-critical):', { error: logErr.message });
        }

        // Send email reply async — không block response
        const targetEmail = (reply_to_email && reply_to_email.trim()) || message.email;

        // Trả response ngay, gửi email ở background
        res.json({
            success: true,
            message: 'Phản hồi tin nhắn thành công',
            data: {
                email_sent: true,
                email_message: 'Email đang được gửi đến ' + targetEmail
            }
        });

        // Gửi email sau khi đã response (non-blocking)
        setImmediate(async () => {
            try {
                const contactForEmail = { ...message, email: targetEmail };
                const emailResult = await emailService.sendContactReply(contactForEmail, reply_message.trim());
                if (emailResult.success) {
                    logger.info('Contact reply email sent', { to: targetEmail, messageId: numId });
                } else {
                    logger.warn('Contact reply email failed', { to: targetEmail, error: emailResult.message });
                }
            } catch (emailErr) {
                logger.warn('Contact reply email error (non-critical):', { error: emailErr.message });
            }
        });

    } catch (error) {
        logger.error('Reply contact message error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi phản hồi tin nhắn'
        });
    }
});

// Update contact message status (admin only)
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }
        const { status } = req.body;

        if (!['new', 'read', 'replied', 'archived'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [numId]);
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
            [numId]
        );

        // Log status change
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'contact_message_status_updated',
                table_name: 'contact_messages',
                record_id: numId,
                old_values: JSON.stringify({ status: message.status }),
                new_values: JSON.stringify({ status }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) {
            logger.warn('Audit log warning (non-critical):', { error: logErr.message });
        }

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thành công'
        });

    } catch (error) {
        logger.error('Update message status error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật trạng thái'
        });
    }
});

// Delete contact message (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Validate id
        const numId = parseInt(id);
        if (!numId || numId < 1) {
            return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
        }

        // Check if message exists
        const message = await db.findOne('SELECT * FROM contact_messages WHERE id = ?', [numId]);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Tin nhắn không tồn tại'
            });
        }

        // Delete message
        await db.delete('contact_messages', 'id = ?', [numId]);

        // Log deletion
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'contact_message_deleted',
                table_name: 'contact_messages',
                record_id: numId,
                old_values: JSON.stringify(message),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) {
            logger.warn('Audit log warning (non-critical):', { error: logErr.message });
        }

        res.json({
            success: true,
            message: 'Xóa tin nhắn thành công'
        });

    } catch (error) {
        logger.error('Delete contact message error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi xóa tin nhắn: ' + error.message
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
        logger.error('Get contact stats error:', { error: error.message });
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
        await auditLog({
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
        logger.error('Bulk update contact messages error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật hàng loạt'
        });
    }
});

module.exports = router;