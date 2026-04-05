/**
 * API Version 1 Routes
 * Main router for API v1
 */

const express = require('express');
const router = express.Router();

// Import v1 routes
const authRoutes = require('../auth');
const userRoutes = require('../users');
const classRoutes = require('../classes');
const eventRoutes = require('../events');
const attendanceRoutes = require('../attendance');
const notificationRoutes = require('../notifications');
const contactRoutes = require('../contact');
const adminRoutes = require('../admin');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/events', eventRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/contact', contactRoutes);
router.use('/admin', adminRoutes);

// API v1 info
router.get('/', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    message: 'CLB Võ Cổ Truyền HUTECH API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      classes: '/api/v1/classes',
      events: '/api/v1/events',
      attendance: '/api/v1/attendance',
      notifications: '/api/v1/notifications',
      contact: '/api/v1/contact',
      admin: '/api/v1/admin'
    },
    documentation: '/api-docs'
  });
});

module.exports = router;
