/**
 * Public Content API
 * Không yêu cầu xác thực — dùng cho website hiển thị tin tức
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

/**
 * GET /api/public/news
 * Lấy danh sách tin tức đã published
 */
router.get('/news', async (req, res) => {
    try {
        const { page = 1, limit = 10, category } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = "status = 'published'";
        const params = [];

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        const dbType = process.env.DB_TYPE || 'mysql';
        let query;

        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} 
                        n.id, n.title, n.slug, n.excerpt, n.category,
                        n.featured_image, n.view_count, n.published_at,
                        n.tags, u.first_name, u.last_name
                     FROM news n
                     LEFT JOIN users u ON n.author_id = u.id
                     WHERE ${whereClause}
                     ORDER BY n.published_at DESC
                     OFFSET ${offset} ROWS`;
        } else {
            query = `SELECT n.id, n.title, n.slug, n.excerpt, n.category,
                        n.featured_image, n.view_count, n.published_at,
                        n.tags, u.first_name, u.last_name
                     FROM news n
                     LEFT JOIN users u ON n.author_id = u.id
                     WHERE ${whereClause}
                     ORDER BY n.published_at DESC
                     LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }

        const news = await db.query(query, params);

        const countResult = await db.findOne(
            `SELECT COUNT(*) as count FROM news WHERE ${whereClause}`,
            category ? [category] : []
        );

        res.json({
            success: true,
            data: {
                news,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult?.count || 0,
                    totalPages: Math.ceil((countResult?.count || 0) / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Public get news error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy tin tức' });
    }
});

/**
 * GET /api/public/news/:id
 * Lấy chi tiết 1 bài tin tức + tăng view_count
 */
router.get('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const news = await db.findOne(
            `SELECT n.*, u.first_name, u.last_name
             FROM news n
             LEFT JOIN users u ON n.author_id = u.id
             WHERE n.id = ? AND n.status = 'published'`,
            [id]
        );

        if (!news) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        // Tăng view count
        await db.query('UPDATE news SET view_count = view_count + 1 WHERE id = ?', [id]);

        res.json({ success: true, data: news });
    } catch (error) {
        console.error('Public get news detail error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết tin tức' });
    }
});

/**
 * GET /api/public/announcements
 * Lấy thông báo đang active
 */
router.get('/announcements', async (req, res) => {
    try {
        const announcements = await db.query(
            `SELECT id, title, content, type, priority, target_audience, created_at
             FROM announcements
             WHERE status = 'active'
               AND (expires_at IS NULL OR expires_at > NOW())
             ORDER BY priority DESC, created_at DESC
             LIMIT 20`,
            []
        );

        res.json({ success: true, data: announcements });
    } catch (error) {
        console.error('Public get announcements error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
    }
});

module.exports = router;
