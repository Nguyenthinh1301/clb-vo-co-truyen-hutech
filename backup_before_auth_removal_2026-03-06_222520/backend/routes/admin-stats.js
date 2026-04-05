/**
 * Admin Statistics Routes
 * API endpoints for admin dashboard statistics
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get new users registered today
router.get('/new-users-today', authenticate, requireAdmin, async (req, res) => {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count users registered today
        const result = await db.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at >= ? AND created_at < ?
        `, [today.toISOString(), tomorrow.toISOString()]);

        const count = result[0]?.count || 0;

        res.json({
            success: true,
            data: {
                count: count,
                date: today.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Error getting new users today:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê user mới'
        });
    }
});

// Get new users by date range
router.get('/new-users', authenticate, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, limit = 100 } = req.query;

        let query = `
            SELECT COUNT(*) as count, CAST(created_at AS DATE) as date
            FROM users
        `;
        const params = [];

        if (startDate && endDate) {
            query += ' WHERE created_at >= ? AND created_at < ?';
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ' WHERE created_at >= ?';
            params.push(startDate);
        }

        query += ' GROUP BY CAST(created_at AS DATE) ORDER BY date DESC';
        
        // Add limit for MSSQL
        if (process.env.DB_TYPE === 'mssql') {
            query = query.replace('SELECT', `SELECT TOP ${limit}`);
        } else {
            query += ` LIMIT ${limit}`;
        }

        const results = await db.query(query, params);

        res.json({
            success: true,
            data: {
                registrations: results
            }
        });

    } catch (error) {
        console.error('Error getting new users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê đăng ký'
        });
    }
});

// Get user registration statistics
router.get('/user-stats', authenticate, requireAdmin, async (req, res) => {
    try {
        // Total users
        const totalResult = await db.query('SELECT COUNT(*) as count FROM users');
        const total = totalResult[0]?.count || 0;

        // Active users
        const activeResult = await db.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
        const active = activeResult[0]?.count || 0;

        // Users by role
        const roleResult = await db.query(`
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        `);

        // Users by membership status
        const membershipResult = await db.query(`
            SELECT membership_status, COUNT(*) as count
            FROM users
            GROUP BY membership_status
        `);

        // New users this month
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const monthResult = await db.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at >= ?
        `, [thisMonth.toISOString()]);
        const thisMonthCount = monthResult[0]?.count || 0;

        // New users today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayResult = await db.query(`
            SELECT COUNT(*) as count
            FROM users
            WHERE created_at >= ? AND created_at < ?
        `, [today.toISOString(), tomorrow.toISOString()]);
        const todayCount = todayResult[0]?.count || 0;

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive: total - active,
                byRole: roleResult,
                byMembership: membershipResult,
                thisMonth: thisMonthCount,
                today: todayCount
            }
        });

    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê user'
        });
    }
});

// Get dashboard overview stats
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
    try {
        // Get all stats in parallel
        const [
            totalUsers,
            activeClasses,
            upcomingEvents,
            pendingUsers
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as count FROM users'),
            db.query('SELECT COUNT(*) as count FROM classes WHERE status = ?', ['active']),
            db.query('SELECT COUNT(*) as count FROM events WHERE status = ? AND start_date >= GETDATE()', ['scheduled']),
            db.query('SELECT COUNT(*) as count FROM users WHERE membership_status = ?', ['pending'])
        ]);

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0]?.count || 0,
                activeClasses: activeClasses[0]?.count || 0,
                upcomingEvents: upcomingEvents[0]?.count || 0,
                pendingUsers: pendingUsers[0]?.count || 0
            }
        });

    } catch (error) {
        console.error('Error getting overview stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê tổng quan'
        });
    }
});

module.exports = router;
