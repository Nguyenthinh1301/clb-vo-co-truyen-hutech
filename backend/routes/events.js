const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auditLog = require('../utils/auditLog');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { ValidationRules, handleValidationErrors } = require('../middleware/validation');

// Get all events (public)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status, upcoming = false } = req.query;

        let whereClause = '1=1';
        let params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (type) {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        if (upcoming === 'true') {
            whereClause += ' AND date >= CAST(GETDATE() AS DATE)';
        }

        const sql = `
            SELECT * FROM events
            WHERE ${whereClause}
            ORDER BY date ASC
        `;

        const events = await db.find(sql, params);

        res.json({
            success: true,
            data: events
        });

    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sự kiện'
        });
    }
});

// Get event details
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const event = await db.findOne(
            `SELECT e.*, 
             u.first_name as organizer_first_name, 
             u.last_name as organizer_last_name,
             u.email as organizer_email
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.id = ? AND e.is_public = 1`,
            [numId]
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Check if user is registered (if authenticated)
        let userRegistration = null;
        if (req.user) {
            userRegistration = await db.findOne(
                'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
                [req.user.id, numId]
            );
        }

        res.json({
            success: true,
            data: { 
                event,
                user_registration: userRegistration
            }
        });

    } catch (error) {
        console.error('Get event details error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy thông tin sự kiện'
        });
    }
});

// Register for event
router.post('/:id/register', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        // Check if event exists and is open for registration
        const event = await db.findOne(
            'SELECT * FROM events WHERE id = ? AND status = "scheduled" AND is_public = 1',
            [numId]
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại hoặc không mở đăng ký'
            });
        }

        // Check registration deadline
        if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Đã hết hạn đăng ký sự kiện'
            });
        }

        // Check if event is full
        if (event.max_participants && event.current_participants >= event.max_participants) {
            return res.status(400).json({
                success: false,
                message: 'Sự kiện đã đầy'
            });
        }

        // Check if user is already registered
        const existingRegistration = await db.findOne(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [req.user.id, numId]
        );

        if (existingRegistration) {
            return res.status(409).json({
                success: false,
                message: 'Bạn đã đăng ký sự kiện này rồi'
            });
        }

        // Create registration
        const registrationId = await db.insert('event_registrations', {
            user_id: req.user.id,
            event_id: numId,
            status: 'registered',
            payment_status: event.registration_fee > 0 ? 'pending' : 'paid'
        });

        // Update event current participants count
        await db.update(
            'events',
            { current_participants: event.current_participants + 1 },
            'id = ?',
            [numId]
        );

        // Log registration
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'event_registered',
                table_name: 'event_registrations',
                record_id: registrationId,
                new_values: JSON.stringify({ user_id: req.user.id, event_id: numId }),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

        res.status(201).json({
            success: true,
            message: 'Đăng ký sự kiện thành công',
            data: { registration_id: registrationId }
        });

    } catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký sự kiện'
        });
    }
});

// Cancel event registration
router.delete('/:id/register', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        // Check if registration exists
        const registration = await db.findOne(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [req.user.id, numId]
        );

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa đăng ký sự kiện này'
            });
        }

        // Check if cancellation is allowed
        const event = await db.findOne('SELECT * FROM events WHERE id = ?', [numId]);
        if (event.start_date <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Không thể hủy đăng ký sau khi sự kiện đã bắt đầu'
            });
        }

        // Update registration status
        await db.update(
            'event_registrations',
            { status: 'cancelled' },
            'id = ?',
            [registration.id]
        );

        // Update event current participants count
        await db.update(
            'events',
            { current_participants: Math.max(0, event.current_participants - 1) },
            'id = ?',
            [numId]
        );

        // Log cancellation
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'event_registration_cancelled',
                table_name: 'event_registrations',
                record_id: registration.id,
                old_values: JSON.stringify(registration),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

        res.json({
            success: true,
            message: 'Hủy đăng ký sự kiện thành công'
        });

    } catch (error) {
        console.error('Cancel event registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi hủy đăng ký sự kiện'
        });
    }
});

// Create new event (admin only)
router.post('/', authenticate, authorize('admin'), ValidationRules.eventCreation, handleValidationErrors, async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            start_date,
            end_date,
            start_time,
            end_time,
            location,
            max_participants,
            registration_fee,
            registration_deadline,
            requirements,
            is_public
        } = req.body;

        // Create event
        const eventId = await db.insert('events', {
            title,
            description: description || null,
            type,
            start_date,
            end_date: end_date || null,
            start_time: start_time || null,
            end_time: end_time || null,
            location: location || null,
            max_participants: max_participants || null,
            registration_fee: registration_fee || 0,
            registration_deadline: registration_deadline || null,
            requirements: requirements || null,
            organizer_id: req.user.id,
            status: 'scheduled',
            is_public: is_public !== false
        });

        // Get created event
        const newEvent = await db.findOne(
            `SELECT e.*, 
             u.first_name as organizer_first_name, 
             u.last_name as organizer_last_name
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.id = ?`,
            [eventId]
        );

        // Log event creation
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'event_created',
                table_name: 'events',
                record_id: eventId,
                new_values: JSON.stringify(newEvent),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

        res.status(201).json({
            success: true,
            message: 'Tạo sự kiện thành công',
            data: { event: newEvent }
        });

    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi tạo sự kiện'
        });
    }
});

// Update event (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        // Check if event exists
        const existingEvent = await db.findOne('SELECT * FROM events WHERE id = ?', [numId]);
        if (!existingEvent) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Prepare update data
        const updateData = {};
        const allowedFields = [
            'title', 'description', 'type', 'start_date', 'end_date', 
            'start_time', 'end_time', 'location', 'max_participants', 
            'registration_fee', 'registration_deadline', 'requirements', 
            'status', 'is_public'
        ];
        
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Update event
        await db.update('events', updateData, 'id = ?', [numId]);

        // Get updated event
        const updatedEvent = await db.findOne(
            `SELECT e.*, 
             u.first_name as organizer_first_name, 
             u.last_name as organizer_last_name
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.id = ?`,
            [numId]
        );

        // Log event update
        try {
            await auditLog({
                user_id: req.user.id,
                action: 'event_updated',
                table_name: 'events',
                record_id: numId,
                old_values: JSON.stringify(existingEvent),
                new_values: JSON.stringify(updatedEvent),
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        } catch (logErr) { console.warn('Audit log warning:', logErr.message); }

        res.json({
            success: true,
            message: 'Cập nhật sự kiện thành công',
            data: { event: updatedEvent }
        });

    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật sự kiện'
        });
    }
});

// Get event participants (admin only)
router.get('/:id/participants', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const numId = parseInt(id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        // Check if event exists
        const event = await db.findOne('SELECT * FROM events WHERE id = ?', [numId]);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Get participants
        const participants = await db.query(
            `SELECT u.id, u.username, u.first_name, u.last_name, u.email, 
             u.phone_number, u.profile_image,
             er.registration_date, er.status, er.payment_status
             FROM event_registrations er
             JOIN users u ON er.user_id = u.id
             WHERE er.event_id = ?
             ORDER BY er.registration_date ASC`,
            [numId]
        );

        res.json({
            success: true,
            data: { participants }
        });

    } catch (error) {
        console.error('Get event participants error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách người tham gia'
        });
    }
});

module.exports = router;
