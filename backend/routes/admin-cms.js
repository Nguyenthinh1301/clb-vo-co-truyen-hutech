/**
 * Admin CMS Routes - Quản lý nội dung CLB
 * POST/PUT/DELETE yêu cầu role admin
 * GET public (không cần auth)
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auditLog = require('../utils/auditLog');
const { AuthUtils, authenticateJwt, requireAdmin } = require('../middleware/auth');
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

// Kiểm tra (không bắt buộc) request có phải của admin không.
// Dùng cho GET công khai: khách chỉ thấy nội dung đã xuất bản, admin thấy cả bản nháp.
async function isAdminRequest(req) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return false;
    try {
        const decoded = AuthUtils.verifyToken(h.substring(7));
        const u = await db.findOne('SELECT role FROM users WHERE id = ? AND is_active = true', [decoded.userId]);
        return !!u && u.role === 'admin';
    } catch (_) {
        return false;
    }
}

// Lỗi 500: ghi chi tiết vào log server, chỉ trả thông báo chung cho client
function serverError(res, e) {
    console.error('[CMS]', e);
    return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại sau' });
}

// ══════════════════════════════════════════════════════════════
//  NEWS
// ══════════════════════════════════════════════════════════════

// GET all news (public)
router.get('/news', async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query, 20, 100);
        const { q, category } = req.query;
        const isAdmin = await isAdminRequest(req);
        // Khách chỉ được xem tin đã xuất bản, bất kể truyền ?status= gì
        const status = isAdmin ? req.query.status : 'published';
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
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        const total = await db.findOne(`SELECT COUNT(*) as cnt FROM news WHERE ${where}`, params);

        const result = { success: true, data: { news: rows, total: total?.cnt || 0 } };
        cacheService.set(cacheKey, result, CACHE_TTL.news);

        // HTTP cache headers cho browser — response của admin có thể chứa bản nháp, không cho CDN cache
        res.set('Cache-Control', isAdmin ? 'private, no-store' : 'public, max-age=30');
        res.json(result);
    } catch (e) {
        serverError(res, e);
    }
});

// GET single news (public)
router.get('/news/:id', async (req, res) => {
    try {
        const row = await db.findOne('SELECT * FROM news WHERE id = ?', [req.params.id]);
        // Tin chưa xuất bản: trả 404 cho khách như thể không tồn tại
        if (!row || (row.status !== 'published' && !(await isAdminRequest(req)))) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        }
        res.json({ success: true, data: row });
    } catch (e) {
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
    }
});

// DELETE news (admin)
router.delete('/news/:id', adminOnly, async (req, res) => {
    try {
        await db.delete('news', 'id = ?', [req.params.id]);
        invalidateCache('news');
        res.json({ success: true, message: 'Đã xóa tin tức' });
    } catch (e) {
        serverError(res, e);
    }
});

// ══════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════

// ── Tự cập nhật trạng thái sự kiện theo ngày + giờ thực ──────────
// Chỉ chuyển TIẾN (upcoming → ongoing → completed), không đụng 'cancelled',
// không lùi trạng thái admin đã đặt. Giờ sự kiện hiểu theo giờ Việt Nam (UTC+7).
const CLUB_TZ_OFFSET_MIN = parseInt(process.env.CLUB_TZ_OFFSET_MINUTES || '420', 10);
const STATUS_RANK = { upcoming: 0, ongoing: 1, completed: 2 };
let lastEventSync = 0;

function eventDateParts(d) {
    if (!d) return null;
    if (d instanceof Date) {
        // DATE từ driver thường là 00:00 UTC; nếu không thì lấy theo giờ máy chủ
        return d.getUTCHours() === 0 && d.getUTCMinutes() === 0
            ? [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]
            : [d.getFullYear(), d.getMonth() + 1, d.getDate()];
    }
    const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? [+m[1], +m[2], +m[3]] : null;
}
function eventTimeParts(t) {
    if (!t) return null;
    if (t instanceof Date) return [t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds()]; // MSSQL TIME
    const s = String(t);
    const m = s.indexOf('T') !== -1 ? null : s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) return [+m[1], +m[2], +(m[3] || 0)];
    const dt = new Date(s);
    return isNaN(dt) ? null : [dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds()];
}
function clubInstant(dp, tp) {
    // dp/tp theo giờ CLB → mốc thời gian UTC (ms)
    return Date.UTC(dp[0], dp[1] - 1, dp[2], tp[0], tp[1], tp[2]) - CLUB_TZ_OFFSET_MIN * 60000;
}
function effectiveEventStatus(ev, now) {
    const dp = eventDateParts(ev.date);
    if (!dp) return ev.status;
    const start = clubInstant(dp, eventTimeParts(ev.start_time) || [0, 0, 0]);
    let   end   = clubInstant(dp, eventTimeParts(ev.end_time)   || [23, 59, 59]);
    if (end < start) end = clubInstant(dp, [23, 59, 59]);
    if (now < start) return 'upcoming';
    if (now <= end)  return 'ongoing';
    return 'completed';
}

async function syncEventStatuses(force) {
    const now = Date.now();
    if (!force && now - lastEventSync < 60000) return; // tối đa 1 lần / phút
    lastEventSync = now;
    try {
        const rows = await db.find(
            "SELECT id, name, date, start_time, end_time, status FROM events WHERE status IN ('upcoming', 'ongoing')", []);
        let changed = 0;
        for (const ev of rows) {
            const eff = effectiveEventStatus(ev, now);
            if (STATUS_RANK[eff] > STATUS_RANK[ev.status]) {
                await db.update('events', { status: eff, updated_at: new Date() }, 'id = ?', [ev.id]);
                changed++;
                auditLog({
                    user_id: null, // hệ thống tự động
                    action: 'event_status_auto_updated',
                    table_name: 'events',
                    record_id: ev.id,
                    old_values: { name: ev.name, status: ev.status },
                    new_values: { name: ev.name, status: eff }
                });
            }
        }
        if (changed) {
            invalidateCache('events');
            console.log(`[events] Tự cập nhật trạng thái cho ${changed} sự kiện`);
        }
    } catch (e) {
        console.error('[events] Lỗi tự cập nhật trạng thái:', e.message);
    }
}

// GET all events (public)
router.get('/events', async (req, res) => {
    try {
        await syncEventStatuses(false);
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
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        const total = await db.findOne(`SELECT COUNT(*) as cnt FROM events WHERE ${where}`, params);

        const result = { success: true, data: { events: rows, total: total?.cnt || 0 } };
        cacheService.set(cacheKey, result, CACHE_TTL.events);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(result);
    } catch (e) {
        serverError(res, e);
    }
});

// GET single event (public)
router.get('/events/:id', async (req, res) => {
    try {
        await syncEventStatuses(false);
        const row = await db.findOne('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: row });
    } catch (e) {
        serverError(res, e);
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
        await syncEventStatuses(true);
        res.status(201).json({ success: true, message: 'Tạo sự kiện thành công', data: { id } });
    } catch (e) {
        serverError(res, e);
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
        await syncEventStatuses(true);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        serverError(res, e);
    }
});

// DELETE event (admin)
router.delete('/events/:id', adminOnly, async (req, res) => {
    try {
        await db.delete('events', 'id = ?', [req.params.id]);
        invalidateCache('events');
        res.json({ success: true, message: 'Đã xóa sự kiện' });
    } catch (e) {
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
    }
});

// ══════════════════════════════════════════════════════════════
//  GALLERY (Thư viện ảnh) — Alias to /api/gallery
// ══════════════════════════════════════════════════════════════

// GET all albums (public)
router.get('/gallery', async (req, res) => {
    try {
        const { status = 'active', all } = req.query;
        const cacheKey = `cms:gallery:albums:${all||'0'}:${status}`;
        const cached   = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const where  = all === '1' ? '1=1' : "a.status = 'active'";
        const albums = await db.find(
            `SELECT a.*,
             (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id) AS photo_count
             FROM gallery_albums a
             WHERE ${where}
             ORDER BY a.sort_order ASC, a.created_at DESC`,
            []
        );

        const result = { success: true, data: { albums, total: albums.length } };
        cacheService.set(cacheKey, result, CACHE_TTL.events);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(result);
    } catch (e) {
        serverError(res, e);
    }
});

// GET single album with photos (public)
router.get('/gallery/:id', async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const cacheKey = `cms:gallery:album:${numId}`;
        const cached   = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const album = await db.findOne('SELECT * FROM gallery_albums WHERE id = ?', [numId]);
        if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });

        const photos = await db.find(
            'SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC',
            [numId]
        );

        const result = { success: true, data: { album, photos } };
        cacheService.set(cacheKey, result, CACHE_TTL.events);
        res.json(result);
    } catch (e) {
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
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
        serverError(res, e);
    }
});

module.exports = router;
