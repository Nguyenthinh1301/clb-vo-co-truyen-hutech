/**
 * Activities Routes — Quản lý Hoạt động / Thành tích CLB
 * GET public | POST/PUT/DELETE yêu cầu admin
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const { cacheService } = require('../services/cacheService');
const logger = require('../services/loggerService');

const adminOnly = [authenticateJwt, requireAdmin];
const CACHE_TTL = 120;

function invalidateCache() {
    cacheService.deletePattern('^activities:');
}

// GET tất cả hoạt động (public)
router.get('/', async (req, res) => {
    try {
        const { type, year, all } = req.query;
        const params = [];
        let where = all === '1' ? '1=1' : "status = 'active'";

        if (type) { where += ' AND type = ?'; params.push(type); }
        if (year) { where += ' AND year = ?'; params.push(parseInt(year)); }

        const cacheKey = `activities:list:${all||'0'}:${type||''}:${year||''}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return res.json(cached);

        const rows = await db.find(
            `SELECT * FROM activities WHERE ${where} ORDER BY year DESC, sort_order ASC, created_at DESC`,
            params
        );
        const result = { success: true, data: rows, total: rows.length };
        cacheService.set(cacheKey, result, CACHE_TTL);
        res.set('Cache-Control', 'public, max-age=60');
        res.json(result);
    } catch (e) {
        logger.error('Get activities error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách hoạt động' });
    }
});

// GET chi tiết (public)
router.get('/:id', async (req, res) => {
    try {
        const row = await db.findOne('SELECT * FROM activities WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: row });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// POST tạo mới (admin)
router.post('/', adminOnly, async (req, res) => {
    try {
        const { title, description, type, medal, year, image, sort_order, status } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Thiếu tiêu đề' });

        const insertData = {
            title,
            description: description || null,
            type:        type        || 'achievement',
            medal:       medal       || null,
            year:        year        ? parseInt(year) : new Date().getFullYear(),
            image:       image       || null,
            sort_order:  sort_order  ? parseInt(sort_order) : 0,
            status:      status      || 'active',
            created_by:  req.user.id
        };

        logger.info('Creating activity:', { data: insertData });
        const id = await db.insert('activities', insertData);
        invalidateCache();
        res.status(201).json({ success: true, message: 'Tạo hoạt động thành công', data: { id } });
    } catch (e) {
        logger.error('Create activity error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo hoạt động' });
    }
});

// PUT cập nhật (admin)
router.put('/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        const existing = await db.findOne('SELECT id FROM activities WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

        const fields = ['title','description','type','medal','year','image','sort_order','status'];
        const upd = { updated_at: new Date() };
        fields.forEach(f => { if (req.body[f] !== undefined) upd[f] = req.body[f]; });
        if (upd.year) upd.year = parseInt(upd.year);
        if (upd.sort_order) upd.sort_order = parseInt(upd.sort_order);

        await db.update('activities', upd, 'id = ?', [numId]);
        invalidateCache();
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (e) {
        logger.error('Update activity error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
});

// DELETE (admin)
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const numId = parseInt(req.params.id);
        const existing = await db.findOne('SELECT id FROM activities WHERE id = ?', [numId]);
        if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

        await db.delete('activities', 'id = ?', [numId]);
        invalidateCache();
        res.json({ success: true, message: 'Đã xóa hoạt động' });
    } catch (e) {
        logger.error('Delete activity error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
});

module.exports = router;
