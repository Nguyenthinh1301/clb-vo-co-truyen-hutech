const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/user/announcements
 * @desc    Get active announcements for user
 * @access  User
 */
router.get('/announcements', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        const dbType = process.env.DB_TYPE || 'mysql';
        let dateCheck;
        
        if (dbType === 'mssql') {
            dateCheck = '(expires_at IS NULL OR expires_at > GETDATE())';
        } else {
            dateCheck = '(expires_at IS NULL OR expires_at > NOW())';
        }
        
        let query;
        const params = [req.user.role];
        
        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} id, title, content, type, priority, created_at, expires_at
                     FROM announcements 
                     WHERE status = 'active' 
                     AND ${dateCheck}
                     AND (target_audience = 'all' OR target_audience = ?)
                     ORDER BY priority DESC, created_at DESC 
                     OFFSET ${offset} ROWS`;
        } else {
            query = `SELECT id, title, content, type, priority, created_at, expires_at
                     FROM announcements 
                     WHERE status = 'active' 
                     AND ${dateCheck}
                     AND (target_audience = 'all' OR target_audience = ?)
                     ORDER BY priority DESC, created_at DESC 
                     LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const announcements = await db.query(query, params);
        
        const total = await db.findOne(
            `SELECT COUNT(*) as count FROM announcements 
             WHERE status = 'active' 
             AND ${dateCheck}
             AND (target_audience = 'all' OR target_audience = ?)`,
            [req.user.role]
        );
        
        res.json({
            success: true,
            data: {
                announcements,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    totalPages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get user announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo'
        });
    }
});

/**
 * @route   GET /api/user/announcements/:id
 * @desc    Get single announcement
 * @access  User
 */
router.get('/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const announcement = await db.findOne(
            `SELECT id, title, content, type, priority, created_at, expires_at
             FROM announcements 
             WHERE id = ? AND status = 'active'`,
            [id]
        );
        
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông báo'
            });
        }
        
        res.json({
            success: true,
            data: { announcement }
        });
    } catch (error) {
        console.error('Get announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông báo'
        });
    }
});

/**
 * @route   GET /api/user/news
 * @desc    Get published news for user
 * @access  User
 */
router.get('/news', async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = "status = 'published'";
        const params = [];
        
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        
        // Use database-agnostic query
        const dbType = process.env.DB_TYPE || 'mysql';
        let query;
        
        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} n.id, n.title, n.excerpt, n.category, n.tags, n.featured_image, 
                            n.published_at, n.views, u.first_name, u.last_name
                     FROM news n
                     LEFT JOIN users u ON n.author_id = u.id
                     WHERE ${whereClause}
                     ORDER BY n.published_at DESC 
                     OFFSET ${offset} ROWS`;
        } else {
            query = `SELECT n.id, n.title, n.excerpt, n.category, n.tags, n.featured_image, 
                            n.published_at, n.views, u.first_name, u.last_name
                     FROM news n
                     LEFT JOIN users u ON n.author_id = u.id
                     WHERE ${whereClause}
                     ORDER BY n.published_at DESC 
                     LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const news = await db.query(query, params);
        
        const total = await db.findOne(
            `SELECT COUNT(*) as count FROM news WHERE ${whereClause}`,
            params
        );
        
        res.json({
            success: true,
            data: {
                news,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total.count,
                    totalPages: Math.ceil(total.count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get user news error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tin tức'
        });
    }
});

/**
 * @route   GET /api/user/news/:id
 * @desc    Get single news article
 * @access  User
 */
router.get('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const newsArticle = await db.findOne(
            `SELECT n.*, u.first_name, u.last_name
             FROM news n
             LEFT JOIN users u ON n.author_id = u.id
             WHERE n.id = ? AND n.status = 'published'`,
            [id]
        );
        
        if (!newsArticle) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tin tức'
            });
        }
        
        // Increment view count
        await db.query(
            'UPDATE news SET views = views + 1 WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            data: { news: newsArticle }
        });
    } catch (error) {
        console.error('Get news article error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy tin tức'
        });
    }
});

/**
 * @route   GET /api/user/dashboard-stats
 * @desc    Get dashboard statistics for user
 * @access  User
 */
router.get('/dashboard-stats', async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's classes count
        const classesCount = await db.findOne(
            `SELECT COUNT(*) as count FROM class_enrollments 
             WHERE user_id = ? AND status = 'active'`,
            [userId]
        );
        
        // Get user's upcoming events
        const dbType = process.env.DB_TYPE || 'mysql';
        let dateCheck;
        
        if (dbType === 'mssql') {
            dateCheck = 'date >= CAST(GETDATE() AS DATE)';
        } else {
            dateCheck = 'event_date >= CURDATE()';
        }
        
        const upcomingEvents = await db.findOne(
            `SELECT COUNT(*) as count FROM event_registrations er
             JOIN events e ON er.event_id = e.id
             WHERE er.user_id = ? AND e.${dateCheck}`,
            [userId]
        );
        
        // Get user's attendance rate
        const attendanceStats = await db.findOne(
            `SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended_sessions
             FROM attendance 
             WHERE user_id = ?`,
            [userId]
        );
        
        const attendanceRate = attendanceStats.total_sessions > 0 
            ? Math.round((attendanceStats.attended_sessions / attendanceStats.total_sessions) * 100)
            : 0;
        
        // Get unread notifications count
        const unreadNotifications = await db.findOne(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND is_read = 0`,
            [userId]
        );
        
        res.json({
            success: true,
            data: {
                stats: {
                    enrolledClasses: classesCount.count,
                    upcomingEvents: upcomingEvents.count,
                    attendanceRate: attendanceRate,
                    unreadNotifications: unreadNotifications.count
                }
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê'
        });
    }
});

/**
 * @route   GET /api/user/recent-activities
 * @desc    Get user's recent activities
 * @access  User
 */
router.get('/recent-activities', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10 } = req.query;
        
        // Use database-agnostic query
        const dbType = process.env.DB_TYPE || 'mysql';
        let query;
        
        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} * FROM (
                        SELECT 
                            'attendance' as type,
                            a.id,
                            a.created_at as date,
                            c.name as title,
                            a.status as status
                        FROM attendance a
                        JOIN classes c ON a.class_id = c.id
                        WHERE a.user_id = ?
                        UNION ALL
                        SELECT 
                            'event' as type,
                            er.id,
                            er.registered_at as date,
                            e.name as title,
                            er.status as status
                        FROM event_registrations er
                        JOIN events e ON er.event_id = e.id
                        WHERE er.user_id = ?
                    ) AS combined
                    ORDER BY date DESC`;
        } else {
            query = `SELECT 
                        'attendance' as type,
                        a.id,
                        a.created_at as date,
                        c.name as title,
                        a.status as status
                     FROM attendance a
                     JOIN classes c ON a.class_id = c.id
                     WHERE a.user_id = ?
                     UNION ALL
                     SELECT 
                        'event' as type,
                        er.id,
                        er.registered_at as date,
                        e.name as title,
                        er.status as status
                     FROM event_registrations er
                     JOIN events e ON er.event_id = e.id
                     WHERE er.user_id = ?
                     ORDER BY date DESC
                     LIMIT ?`;
        }
        
        const params = dbType === 'mssql' 
            ? [userId, userId]
            : [userId, userId, parseInt(limit)];
        
        const activities = await db.query(query, params);
        
        res.json({
            success: true,
            data: { activities }
        });
    } catch (error) {
        console.error('Get recent activities error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy hoạt động gần đây'
        });
    }
});

module.exports = router;
