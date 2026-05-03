/**
 * API Version 1 Routes
 */

const express = require('express');
const router  = express.Router();

const authRoutes         = require('../auth');
const userRoutes         = require('../users');
const classRoutes        = require('../classes');
const eventRoutes        = require('../events');
const attendanceRoutes   = require('../attendance');
const notificationRoutes = require('../notifications');
const contactRoutes      = require('../contact');

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/classes',       classRoutes);
router.use('/events',        eventRoutes);
router.use('/attendance',    attendanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact',       contactRoutes);

router.get('/', (req, res) => {
    res.json({
        success: true,
        version: '1.0.0',
        message: 'CLB Võ Cổ Truyền HUTECH API v1',
        endpoints: {
            auth:          '/api/v1/auth',
            users:         '/api/v1/users',
            classes:       '/api/v1/classes',
            events:        '/api/v1/events',
            attendance:    '/api/v1/attendance',
            notifications: '/api/v1/notifications',
            contact:       '/api/v1/contact'
        },
        documentation: '/api-docs'
    });
});

module.exports = router;
