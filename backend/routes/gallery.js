/**
 * Gallery Routes — Quản lý thư viện ảnh
 * GET public (không cần auth)
 * POST/PUT/DELETE yêu cầu admin
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const { cacheService } = require('../services/cacheService');
const logger = require('../services/loggerService');

const adminOnly   = [authenticateJwt, requireAdmin];
const CACHE_TTL   = 60; // 60 giây

function invalidateCache() {
    cacheService.deletePattern('^gallery:');
}

// ══════════════════════════════════════════════════════════════
//  ALBUMS
// ══════════════════════════════════════════════════════════════

// GET tất cả albums + số ảnh (public)
router.get('/albums', async (req, res) => {
    try {
        const { status = 'active', all } = req.query;
        const cacheKey = `gallery:albums:${all||'0'}:${status}`;
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

        const result = { success: true, data: albums, total: albums.length };
        cacheService.set(cacheKey, result, CACHE_TTL);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(result);
    } catch (e) {
        logger.error('Get gallery albums error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách album' });
    }
});

// GET chi tiết album + danh sách ảnh (public)
router.get('/albums/:id', async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const cacheKey = `gallery:album:${numId}`;
        const cached   = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const album = await db.findOne('SELECT * FROM gallery_albums WHERE id = ?', [numId]);
        if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });

        const photos = await db.find(
            'SELECT * FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC',
            [numId]
        );

        const result = { success: true, data: { album, photos } };
        cacheService.set(cacheKey, result, CACHE_TTL);
        res.json(result);
    } catch (e) {
        logger.error('Get gallery album detail error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết album' });
    }
});

// POST tạo album mới (admin)
router.post('/albums', adminOnly, async (req, res) => {
    try {
        const { name, description, cover_image, sort_order, status } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Tên album là bắt buộc' });

        const id = await db.insert('gallery_albums', {
            name:        name.trim(),
            description: description || null,
            cover_image: cover_image || null,
            sort_order:  parseInt(sort_order) || 0,
            status:      status || 'active',
            created_by:  req.user.id
        });
        invalidateCache();
        res.status(201).json({ success: true, message: 'Tạo album thành công', data: { id } });
    } catch (e) {
        logger.error('Create gallery album error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo album' });
    }
});

// PUT cập nhật album (admin)
router.put('/albums/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const existing = await db.findOne('SELECT id FROM gallery_albums WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Album không tồn tại' });

        const upd = { updated_at: new Date() };
        const fields = ['name', 'description', 'cover_image', 'sort_order', 'status'];
        fields.forEach(f => { if (req.body[f] !== undefined) upd[f] = req.body[f]; });

        await db.update('gallery_albums', upd, 'id = ?', [numId]);
        invalidateCache();
        res.json({ success: true, message: 'Cập nhật album thành công' });
    } catch (e) {
        logger.error('Update gallery album error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật album' });
    }
});

// DELETE album (admin) — xóa cả ảnh trong album (CASCADE)
router.delete('/albums/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const existing = await db.findOne('SELECT id, name FROM gallery_albums WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Album không tồn tại' });

        // Xóa album — gallery_photos tự xóa theo CASCADE
        await db.delete('gallery_albums', 'id = ?', [numId]);
        invalidateCache();
        res.json({ success: true, message: `Đã xóa album "${existing.name}"` });
    } catch (e) {
        logger.error('Delete gallery album error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa album' });
    }
});

// ══════════════════════════════════════════════════════════════
//  PHOTOS
// ══════════════════════════════════════════════════════════════

// POST thêm ảnh vào album (admin)
router.post('/albums/:id/photos', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID album không hợp lệ' });

        const album = await db.findOne('SELECT id FROM gallery_albums WHERE id = ?', [numId]);
        if (!album) return res.status(404).json({ success: false, message: 'Album không tồn tại' });

        const { photos } = req.body; // [{ image_url, caption, sort_order }]
        if (!Array.isArray(photos) || photos.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách ảnh không hợp lệ' });
        }

        // Lấy sort_order hiện tại lớn nhất
        const maxSort = await db.findOne(
            'SELECT MAX(sort_order) as max_sort FROM gallery_photos WHERE album_id = ?', [numId]
        );
        let nextSort = (maxSort?.max_sort || 0) + 1;

        const inserted = [];
        for (const photo of photos) {
            if (!photo.image_url) continue;
            const photoId = await db.insert('gallery_photos', {
                album_id:   numId,
                image_url:  photo.image_url,
                caption:    photo.caption || null,
                sort_order: photo.sort_order !== undefined ? photo.sort_order : nextSort++
            });
            inserted.push(photoId);
        }

        // Cập nhật cover_image nếu album chưa có
        const albumData = await db.findOne('SELECT cover_image FROM gallery_albums WHERE id = ?', [numId]);
        if (!albumData.cover_image && photos[0]?.image_url) {
            await db.update('gallery_albums', { cover_image: photos[0].image_url, updated_at: new Date() }, 'id = ?', [numId]);
        }

        invalidateCache();
        res.status(201).json({
            success: true,
            message: `Đã thêm ${inserted.length} ảnh vào album`,
            data: { inserted_count: inserted.length }
        });
    } catch (e) {
        logger.error('Add gallery photos error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm ảnh' });
    }
});

// DELETE xóa ảnh (admin)
router.delete('/photos/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const photo = await db.findOne('SELECT * FROM gallery_photos WHERE id = ?', [numId]);
        if (!photo) return res.status(404).json({ success: false, message: 'Ảnh không tồn tại' });

        await db.delete('gallery_photos', 'id = ?', [numId]);

        // Nếu ảnh này là cover của album → reset cover về ảnh đầu tiên còn lại
        const album = await db.findOne('SELECT * FROM gallery_albums WHERE id = ?', [photo.album_id]);
        if (album && album.cover_image === photo.image_url) {
            const firstPhoto = await db.findOne(
                'SELECT image_url FROM gallery_photos WHERE album_id = ? ORDER BY sort_order ASC',
                [photo.album_id]
            );
            await db.update('gallery_albums',
                { cover_image: firstPhoto?.image_url || null, updated_at: new Date() },
                'id = ?', [photo.album_id]
            );
        }

        invalidateCache();
        res.json({ success: true, message: 'Đã xóa ảnh' });
    } catch (e) {
        logger.error('Delete gallery photo error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa ảnh' });
    }
});

// PUT cập nhật caption ảnh (admin)
router.put('/photos/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        if (!numId || numId < 1) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

        const photo = await db.findOne('SELECT id FROM gallery_photos WHERE id = ?', [numId]);
        if (!photo) return res.status(404).json({ success: false, message: 'Ảnh không tồn tại' });

        const upd = {};
        if (req.body.caption    !== undefined) upd.caption    = req.body.caption;
        if (req.body.sort_order !== undefined) upd.sort_order = parseInt(req.body.sort_order);

        await db.update('gallery_photos', upd, 'id = ?', [numId]);
        invalidateCache();
        res.json({ success: true, message: 'Cập nhật ảnh thành công' });
    } catch (e) {
        logger.error('Update gallery photo error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật ảnh' });
    }
});

module.exports = router;
