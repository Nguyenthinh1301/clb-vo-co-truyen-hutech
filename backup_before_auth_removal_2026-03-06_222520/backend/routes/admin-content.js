const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/content/announcements
 * @desc    Get all announcements
 * @access  Admin
 */
router.get('/announcements', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '1=1';
        const params = [];
        
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        
        // Use database-agnostic query
        const dbType = process.env.DB_TYPE || 'mysql';
        let query;
        
        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} * FROM announcements 
                     WHERE ${whereClause} 
                     ORDER BY created_at DESC 
                     OFFSET ${offset} ROWS`;
        } else {
            query = `SELECT * FROM announcements 
                     WHERE ${whereClause} 
                     ORDER BY created_at DESC 
                     LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);
        }
        
        const announcements = await db.query(query, params);
        
        const total = await db.findOne(
            `SELECT COUNT(*) as count FROM announcements WHERE ${whereClause}`,
            params
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
        console.error('Get announcements error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thông báo'
        });
    }
});

/**
 * @route   POST /api/admin/content/announcements
 * @desc    Create new announcement
 * @access  Admin
 */
router.post('/announcements', async (req, res) => {
    try {
        const { title, content, type, priority, target_audience, expires_at } = req.body;
        
        const announcementId = await db.insert('announcements', {
            title,
            content,
            type: type || 'general',
            priority: priority || 'normal',
            target_audience: target_audience || 'all',
            status: 'active',
            created_by: req.user.id,
            expires_at: expires_at || null
        });
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'announcement_created',
            table_name: 'announcements',
            record_id: announcementId,
            new_values: JSON.stringify({ title, type, priority }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.status(201).json({
            success: true,
            message: 'Tạo thông báo thành công',
            data: { id: announcementId }
        });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo thông báo'
        });
    }
});

/**
 * @route   PUT /api/admin/content/announcements/:id
 * @desc    Update announcement
 * @access  Admin
 */
router.put('/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, type, priority, target_audience, status, expires_at } = req.body;
        
        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (type) updateData.type = type;
        if (priority) updateData.priority = priority;
        if (target_audience) updateData.target_audience = target_audience;
        if (status) updateData.status = status;
        if (expires_at !== undefined) updateData.expires_at = expires_at;
        updateData.updated_at = new Date();
        
        await db.update('announcements', updateData, 'id = ?', [id]);
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'announcement_updated',
            table_name: 'announcements',
            record_id: id,
            new_values: JSON.stringify(updateData),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Cập nhật thông báo thành công'
        });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông báo'
        });
    }
});

/**
 * @route   DELETE /api/admin/content/announcements/:id
 * @desc    Delete announcement
 * @access  Admin
 */
router.delete('/announcements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.delete('announcements', 'id = ?', [id]);
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'announcement_deleted',
            table_name: 'announcements',
            record_id: id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Xóa thông báo thành công'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa thông báo'
        });
    }
});

/**
 * @route   GET /api/admin/content/news
 * @desc    Get all news
 * @access  Admin
 */
router.get('/news', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;
        
        let whereClause = '1=1';
        const params = [];
        
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        
        // Use database-agnostic query
        const dbType = process.env.DB_TYPE || 'mysql';
        let query;
        
        if (dbType === 'mssql') {
            query = `SELECT TOP ${parseInt(limit)} n.*, u.first_name, u.last_name 
                     FROM news n
                     LEFT JOIN users u ON n.author_id = u.id
                     WHERE ${whereClause} 
                     ORDER BY n.published_at DESC 
                     OFFSET ${offset} ROWS`;
        } else {
            query = `SELECT n.*, u.first_name, u.last_name 
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
        console.error('Get news error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tin tức'
        });
    }
});

/**
 * @route   POST /api/admin/content/news
 * @desc    Create new news article
 * @access  Admin
 */
router.post('/news', async (req, res) => {
    try {
        const { title, content, excerpt, category, tags, featured_image, status } = req.body;
        
        const newsId = await db.insert('news', {
            title,
            content,
            excerpt: excerpt || content.substring(0, 200),
            category: category || 'general',
            tags: tags ? JSON.stringify(tags) : null,
            featured_image,
            author_id: req.user.id,
            status: status || 'draft',
            published_at: status === 'published' ? new Date() : null
        });
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'news_created',
            table_name: 'news',
            record_id: newsId,
            new_values: JSON.stringify({ title, category, status }),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.status(201).json({
            success: true,
            message: 'Tạo tin tức thành công',
            data: { id: newsId }
        });
    } catch (error) {
        console.error('Create news error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo tin tức'
        });
    }
});

/**
 * @route   PUT /api/admin/content/news/:id
 * @desc    Update news article
 * @access  Admin
 */
router.put('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, category, tags, featured_image, status } = req.body;
        
        const updateData = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (excerpt) updateData.excerpt = excerpt;
        if (category) updateData.category = category;
        if (tags) updateData.tags = JSON.stringify(tags);
        if (featured_image) updateData.featured_image = featured_image;
        if (status) {
            updateData.status = status;
            if (status === 'published') {
                updateData.published_at = new Date();
            }
        }
        updateData.updated_at = new Date();
        
        await db.update('news', updateData, 'id = ?', [id]);
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'news_updated',
            table_name: 'news',
            record_id: id,
            new_values: JSON.stringify(updateData),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Cập nhật tin tức thành công'
        });
    } catch (error) {
        console.error('Update news error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tin tức'
        });
    }
});

/**
 * @route   DELETE /api/admin/content/news/:id
 * @desc    Delete news article
 * @access  Admin
 */
router.delete('/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.delete('news', 'id = ?', [id]);
        
        // Log activity
        await db.insert('audit_logs', {
            user_id: req.user.id,
            action: 'news_deleted',
            table_name: 'news',
            record_id: id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        
        res.json({
            success: true,
            message: 'Xóa tin tức thành công'
        });
    } catch (error) {
        console.error('Delete news error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa tin tức'
        });
    }
});

module.exports = router;
