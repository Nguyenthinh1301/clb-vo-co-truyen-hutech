/**
 * Admin CMS Routes - Quản lý nội dung CLB
 * POST/PUT/DELETE yêu cầu role admin
 * GET public (không cần auth)
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticate, authenticateJwt, requireAdmin } = require('../middleware/auth');
const { cacheService } = require('../services/cacheService');
const { parsePagination } = require('../middleware/validation');

// TTL cache cho public endpoints (giây)
const CACHE_TTL = {
    news:          60,   // 1 phút — tin tức ít thay đổi
    events:        60,   // 1 phút
    announcements: 30,   // 30 giây — thông báo cần cập nhật nhanh hơn
    reviews:       120   // 2 phút
};

// Helper: xóa cache khi có thay đổi dữ liệu
function invalidateCache(prefix) {
    cacheService.deletePattern(`^cms:${prefix}`);
}
// ─── MIDDLEWARE ────────────────────────────────────────────────
// Dùng authenticateJwt thay vì authenticate để không phụ thuộc DB session
// → tránh bị logout khi session hết hạn nhưng JWT vẫn còn hạn
const adminOnly = [authenticateJwt, requireAdmin];

// ══════════════════════════════════════════════════════════════
//  NEWS
// ══════════════════════════════════════════════════════════════

// GET all news (public)
router.get('/news', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 20, 100);
        const { status, q, category } = req.query;
        const params = [];
        let where = '1=1';

        if (status)   { where += ' AND status = ?';   params.push(status); }
        if (category) { where += ' AND category = ?'; params.push(category); }
        if (q && q.trim()) {
            where += ' AND (title LIKE ? OR excerpt LIKE ?)';
            const kw = '%' + q.trim() + '%';
            params.push(kw, kw);
        }

        // Cache key dựa trên query params
        const cacheKey = `cms:news:${page}:${limit}:${status||''}:${category||''}:${q||''}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const rows = await db.find(
            `SELECT id, title, excerpt, category, tags, featured_image, status, published_at, created_at
             FROM news WHERE ${where} ORDER BY created_at DESC
             OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
            params
        );
        const total = await db.findOne(`SELECT COUNT(*) as cnt FROM news WHERE ${where}`, params);

        const result = { success: true, data: { news: rows, total: total?.cnt || 0 } };
        cacheService.set(cacheKey, result, CACHE_TTL.news);

        // HTTP cache headers cho browser
        res.set('Cache-Control', 'public, max-age=30');
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET single news (public)
router.get('/news/:id', async (req, res) => {
    try {
        const row = await db.findOne('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: row });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST create news (admin)
router.post('/news', adminOnly, async (req, res) => {
    try {
        const { title, content, excerpt, category, featured_image, status, tags } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung' });

        const id = await db.insert('news', {
            title, content,
            excerpt:        excerpt || content.substring(0, 200),
            category:       category || 'general',
            featured_image: featured_image || null,
            tags:           tags || null,
            author_id:      req.user.id,
            status:         status || 'draft',
            published_at:   status === 'published' ? new Date() : null
        });
        invalidateCache('news');
        res.status(201).json({ success: true, message: 'Tạo tin tức thành công', data: { id } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT update news (admin)
router.put('/news/:id', adminOnly, async (req, res) => {
    try {
        const { title, content, excerpt, category, featured_image, status, tags } = req.body;
        const upd = { updated_at: new Date() };
        if (title)          upd.title          = title;
        if (content)        upd.content        = content;
        if (excerpt)        upd.excerpt        = excerpt;
        if (category)       upd.category       = category;
        if (featured_image !== undefined) upd.featured_image = featured_image;
        if (tags !== undefined) upd.tags = tags;
        if (status) {
            upd.status = status;
            if (status === 'published') upd.published_at = new Date();
        }
        await db.update('news', upd, 'id = ?', [req.params.id]);
        invalidateCache('news');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE news (admin)
router.delete('/news/:id', adminOnly, async (req, res) => {
    try {
        await db.delete('news', 'id = ?', [req.params.id]);
        invalidateCache('news');
        res.json({ success: true, message: 'Đã xóa tin tức' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════

// GET all events (public)
router.get('/events', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 20, 100);
        const { status, type, q } = req.query;
        const params = [];
        let where = '1=1';

        if (status) { where += ' AND status = ?'; params.push(status); }
        if (type)   { where += ' AND type = ?';   params.push(type); }
        if (q && q.trim()) {
            where += ' AND (name LIKE ? OR location LIKE ? OR description LIKE ?)';
            const kw = '%' + q.trim() + '%';
            params.push(kw, kw, kw);
        }

        const cacheKey = `cms:events:${page}:${limit}:${status||''}:${type||''}:${q||''}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const rows = await db.find(
            `SELECT * FROM events WHERE ${where} ORDER BY date DESC
             OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
            params
        );
        const total = await db.findOne(`SELECT COUNT(*) as cnt FROM events WHERE ${where}`, params);

        const result = { success: true, data: { events: rows, total: total?.cnt || 0 } };
        cacheService.set(cacheKey, result, CACHE_TTL.events);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// GET single event (public)
router.get('/events/:id', async (req, res) => {
    try {
        const row = await db.findOne('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: row });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST create event (admin)
router.post('/events', adminOnly, async (req, res) => {
    try {
        const { name, description, type, location, date, start_time, end_time, max_participants, image, status } = req.body;
        if (!name || !date) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc ngày' });

        const id = await db.insert('events', {
            name, description: description || null,
            type:             type || 'other',
            location:         location || null,
            date,
            start_time:       start_time || null,
            end_time:         end_time || null,
            max_participants: max_participants || null,
            image:            image || null,
            status:           status || 'upcoming'
        });
        invalidateCache('events');
        res.status(201).json({ success: true, message: 'Tạo sự kiện thành công', data: { id } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT update event (admin)
router.put('/events/:id', adminOnly, async (req, res) => {
    try {
        const fields = ['name','description','type','location','date','start_time','end_time','max_participants','image','status'];
        const upd = { updated_at: new Date() };
        fields.forEach(f => { if (req.body[f] !== undefined) upd[f] = req.body[f]; });
        await db.update('events', upd, 'id = ?', [req.params.id]);
        invalidateCache('events');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE event (admin)
router.delete('/events/:id', adminOnly, async (req, res) => {
    try {
        await db.delete('events', 'id = ?', [req.params.id]);
        invalidateCache('events');
        res.json({ success: true, message: 'Đã xóa sự kiện' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════

// GET all announcements (public — trả về active; admin có thể xem tất cả qua query param)
router.get('/announcements', async (req, res) => {
    try {
        const { all, status, type, priority, q } = req.query;
        const params = [];
        let where = all === '1' ? '1=1' : "status = 'active'";

        if (status   && all === '1') { where += ' AND status = ?';   params.push(status); }
        if (type)                    { where += ' AND type = ?';      params.push(type); }
        if (priority)                { where += ' AND priority = ?';  params.push(priority); }
        if (q && q.trim()) {
            where += ' AND (title LIKE ? OR content LIKE ?)';
            const kw = '%' + q.trim() + '%';
            params.push(kw, kw);
        }

        const cacheKey = `cms:announcements:${all||'0'}:${status||''}:${type||''}:${priority||''}:${q||''}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const rows = await db.find(
            `SELECT * FROM announcements WHERE ${where} ORDER BY created_at DESC`,
            params
        );
        const result = { success: true, data: rows, total: rows.length };
        cacheService.set(cacheKey, result, CACHE_TTL.announcements);
        // no-cache: browser luôn hỏi server, nhưng server trả từ in-memory cache (~1ms)
        // Đảm bảo thông báo mới hiển thị ngay sau khi admin tạo
        res.set('Cache-Control', 'no-cache');
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST create announcement (admin)
router.post('/announcements', adminOnly, async (req, res) => {
    try {
        const { title, content, type, priority, target_audience, expires_at } = req.body;
        if (!title || !content) return res.status(400).json({ success: false, message: 'Thiếu tiêu đề hoặc nội dung' });

        const id = await db.insert('announcements', {
            title, content,
            type:            type || 'general',
            priority:        priority || 'normal',
            target_audience: target_audience || 'all',
            status:          'active',
            created_by:      req.user.id,
            expires_at:      expires_at || null
        });
        invalidateCache('announcements');
        res.set('Cache-Control', 'no-store');
        res.status(201).json({ success: true, message: 'Tạo thông báo thành công', data: { id } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT update announcement (admin)
router.put('/announcements/:id', adminOnly, async (req, res) => {
    try {
        const fields = ['title','content','type','priority','target_audience','status','expires_at'];
        const upd = { updated_at: new Date() };
        fields.forEach(f => { if (req.body[f] !== undefined) upd[f] = req.body[f]; });
        await db.update('announcements', upd, 'id = ?', [req.params.id]);
        invalidateCache('announcements');
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE announcement (admin)
router.delete('/announcements/:id', adminOnly, async (req, res) => {
    try {
        await db.delete('announcements', 'id = ?', [req.params.id]);
        invalidateCache('announcements');
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, message: 'Đã xóa thông báo' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// ══════════════════════════════════════════════════════════════
//  REVIEWS (Cảm nhận sinh viên)
// ══════════════════════════════════════════════════════════════

// GET all reviews (public)
router.get('/reviews', async (req, res) => {
    try {
        const { status, rating, q, all } = req.query;
        const params = [];
        let where = all === '1' ? '1=1' : "status = 'active'";

        if (status && all === '1') { where += ' AND status = ?'; params.push(status); }
        if (rating)                { where += ' AND rating = ?'; params.push(parseInt(rating)); }
        if (q && q.trim()) {
            where += ' AND (author_name LIKE ? OR content LIKE ? OR faculty LIKE ?)';
            const kw = '%' + q.trim() + '%';
            params.push(kw, kw, kw);
        }

        const cacheKey = `cms:reviews:${all||'0'}:${status||''}:${rating||''}:${q||''}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const rows = await db.find(
            `SELECT * FROM reviews WHERE ${where} ORDER BY created_at DESC`,
            params
        );
        const result = { success: true, data: rows, total: rows.length };
        cacheService.set(cacheKey, result, CACHE_TTL.reviews);
        res.set('Cache-Control', 'public, max-age=60');
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST create review (admin)
router.post('/reviews', adminOnly, async (req, res) => {
    try {
        const { author_name, faculty, year, rating, content, status, avatar_url } = req.body;
        if (!author_name || !content)
            return res.status(400).json({ success: false, message: 'Thiếu tên hoặc nội dung' });

        const id = await db.insert('reviews', {
            author_name,
            faculty:    faculty    || null,
            year:       year       || null,
            rating:     rating     || 5,
            content,
            status:     status     || 'active',
            avatar_url: avatar_url || null,
            created_by: req.user.id
        });
        invalidateCache('reviews');
        res.status(201).json({ success: true, message: 'Tạo cảm nhận thành công', data: { id } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// PUT update review (admin)
router.put('/reviews/:id', adminOnly, async (req, res) => {
    try {
        const fields = ['author_name','faculty','year','rating','content','status','avatar_url'];
        const upd = { updated_at: new Date() };
        fields.forEach(f => { if (req.body[f] !== undefined) upd[f] = req.body[f]; });
        await db.update('reviews', upd, 'id = ?', [req.params.id]);
        invalidateCache('reviews');
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// DELETE review (admin)
router.delete('/reviews/:id', adminOnly, async (req, res) => {
    try {
        const existing = await db.findOne('SELECT id FROM reviews WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        await db.delete('reviews', 'id = ?', [req.params.id]);
        invalidateCache('reviews');
        res.json({ success: true, message: 'Đã xóa cảm nhận' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

module.exports = router;
