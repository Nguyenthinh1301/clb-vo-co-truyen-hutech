/**
 * Team Routes — Đội ngũ CLB (Ban chủ nhiệm, Ban huấn luyện, Ban truyền thông)
 *
 *   GET    /api/team              public  — danh sách thành viên đang hiển thị
 *   GET    /api/team/:slug        public  — chi tiết 1 thành viên (theo slug hoặc id)
 *   GET    /api/team/admin/all    admin   — tất cả (kể cả đang ẩn)
 *   POST   /api/team              admin   — thêm
 *   PUT    /api/team/:id          admin   — cập nhật (một phần)
 *   DELETE /api/team/:id          admin   — xóa
 *
 * Bảng team_members tự tạo khi được gọi lần đầu và nạp sẵn dữ liệu từ các trang tĩnh.
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const logger  = require('../services/loggerService');

const adminOnly = [authenticateJwt, requireAdmin];

const GROUPS      = ['board', 'coach', 'media', 'other'];
const JSON_FIELDS = ['card_details', 'stats', 'info', 'achievements', 'gallery'];
const TEXT_FIELDS = ['slug', 'full_name', 'short_name', 'role', 'role_icon', 'group_key',
                     'avatar', 'bio_title', 'bio', 'ach_title', 'status'];
const INT_FIELDS  = ['sort_order', 'show_home'];

// ── Tạo bảng (theo loại CSDL) + nạp dữ liệu ban đầu ──────────────
const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();

const DDL = {
    mssql: `
IF OBJECT_ID('team_members', 'U') IS NULL
CREATE TABLE team_members (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    slug         NVARCHAR(120) NOT NULL UNIQUE,
    full_name    NVARCHAR(150) NOT NULL,
    short_name   NVARCHAR(150) NULL,
    role         NVARCHAR(150) NULL,
    role_icon    NVARCHAR(50)  NULL,
    group_key    NVARCHAR(30)  NOT NULL DEFAULT 'other',
    avatar       NVARCHAR(500) NULL,
    card_details NVARCHAR(MAX) NULL,
    stats        NVARCHAR(MAX) NULL,
    info         NVARCHAR(MAX) NULL,
    bio_title    NVARCHAR(100) NULL,
    bio          NVARCHAR(MAX) NULL,
    ach_title    NVARCHAR(100) NULL,
    achievements NVARCHAR(MAX) NULL,
    gallery      NVARCHAR(MAX) NULL,
    show_home    INT NOT NULL DEFAULT 0,
    sort_order   INT NOT NULL DEFAULT 0,
    status       NVARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at   DATETIME NOT NULL DEFAULT GETDATE()
)`,
    postgres: `
CREATE TABLE IF NOT EXISTS team_members (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(120) NOT NULL UNIQUE,
    full_name    VARCHAR(150) NOT NULL,
    short_name   VARCHAR(150),
    role         VARCHAR(150),
    role_icon    VARCHAR(50),
    group_key    VARCHAR(30)  NOT NULL DEFAULT 'other',
    avatar       VARCHAR(500),
    card_details TEXT,
    stats        TEXT,
    info         TEXT,
    bio_title    VARCHAR(100),
    bio          TEXT,
    ach_title    VARCHAR(100),
    achievements TEXT,
    gallery      TEXT,
    show_home    INT NOT NULL DEFAULT 0,
    sort_order   INT NOT NULL DEFAULT 0,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
)`,
    mysql: `
CREATE TABLE IF NOT EXISTS team_members (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    slug         VARCHAR(120) NOT NULL UNIQUE,
    full_name    VARCHAR(150) NOT NULL,
    short_name   VARCHAR(150),
    role         VARCHAR(150),
    role_icon    VARCHAR(50),
    group_key    VARCHAR(30)  NOT NULL DEFAULT 'other',
    avatar       VARCHAR(500),
    card_details LONGTEXT,
    stats        LONGTEXT,
    info         LONGTEXT,
    bio_title    VARCHAR(100),
    bio          LONGTEXT,
    ach_title    VARCHAR(100),
    achievements LONGTEXT,
    gallery      LONGTEXT,
    show_home    INT NOT NULL DEFAULT 0,
    sort_order   INT NOT NULL DEFAULT 0,
    status       VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4`
};

let readyPromise = null;
function ensureTable() {
    if (!readyPromise) {
        readyPromise = (async () => {
            const ddl = DB_TYPE === 'mssql' ? DDL.mssql
                      : (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') ? DDL.postgres
                      : DDL.mysql;
            await db.query(ddl);

            const rows = await db.find('SELECT COUNT(*) AS cnt FROM team_members', []);
            const cnt  = rows && rows[0] ? parseInt(rows[0].cnt, 10) : 0;
            if (!cnt) {
                const seed = require('../database/seeds/team-members');
                for (const m of seed) {
                    await db.insert('team_members', toRow(Object.assign({ status: 'active' }, m), true));
                }
                logger.info('team_members: đã nạp ' + seed.length + ' thành viên ban đầu');
            }
        })().catch(err => {
            readyPromise = null; // cho phép thử lại ở request sau
            throw err;
        });
    }
    return readyPromise;
}

// ── Helpers ──────────────────────────────────────────────────────
function slugify(s) {
    return String(s || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .substring(0, 100);
}

function parseJson(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch (e) { return fallback; }
}

/** Chuẩn hóa body → cột trong CSDL. full=true: điền mặc định cho mọi cột (khi tạo mới) */
function toRow(body, full) {
    const row = {};
    TEXT_FIELDS.forEach(f => {
        if (body[f] !== undefined) row[f] = body[f] === null ? null : String(body[f]).trim();
    });
    INT_FIELDS.forEach(f => {
        if (body[f] !== undefined) row[f] = body[f] === true ? 1 : body[f] === false ? 0 : (parseInt(body[f], 10) || 0);
    });
    JSON_FIELDS.forEach(f => {
        if (body[f] !== undefined) row[f] = JSON.stringify(Array.isArray(body[f]) ? body[f] : []);
    });
    if (row.group_key !== undefined && !GROUPS.includes(row.group_key)) row.group_key = 'other';
    if (row.status    !== undefined && !['active', 'inactive'].includes(row.status)) row.status = 'active';
    if (full) {
        if (row.group_key  === undefined) row.group_key  = 'other';
        if (row.status     === undefined) row.status     = 'active';
        if (row.sort_order === undefined) row.sort_order = 0;
        if (row.show_home  === undefined) row.show_home  = 0;
        JSON_FIELDS.forEach(f => { if (row[f] === undefined) row[f] = '[]'; });
    }
    return row;
}

function fromRow(r) {
    if (!r) return r;
    const out = Object.assign({}, r);
    JSON_FIELDS.forEach(f => { out[f] = parseJson(r[f], []); });
    out.show_home  = !!parseInt(r.show_home, 10);
    out.sort_order = parseInt(r.sort_order, 10) || 0;
    return out;
}

const ORDER = `ORDER BY CASE group_key WHEN 'board' THEN 1 WHEN 'coach' THEN 2 WHEN 'media' THEN 3 ELSE 4 END, sort_order ASC, id ASC`;

async function readyOr500(res) {
    try { await ensureTable(); return true; }
    catch (e) {
        logger.error('team_members init error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Không khởi tạo được dữ liệu đội ngũ: ' + e.message });
        return false;
    }
}

// ── Routes ───────────────────────────────────────────────────────

// Admin: tất cả (đặt trước /:slug)
router.get('/admin/all', adminOnly, async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const rows = await db.find(`SELECT * FROM team_members ${ORDER}`, []);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: rows.map(fromRow) });
    } catch (e) {
        logger.error('Get team (admin) error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đội ngũ' });
    }
});

// Public: danh sách đang hiển thị
router.get('/', async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const params = [];
        let where = "status = 'active'";
        if (req.query.group && GROUPS.includes(req.query.group)) { where += ' AND group_key = ?'; params.push(req.query.group); }
        if (req.query.home === '1') where += ' AND show_home = 1';
        const rows = await db.find(`SELECT * FROM team_members WHERE ${where} ${ORDER}`, params);
        res.set('Cache-Control', 'no-cache');
        res.json({ success: true, data: rows.map(fromRow) });
    } catch (e) {
        logger.error('Get team error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách đội ngũ' });
    }
});

// Public: chi tiết theo slug (hoặc id)
router.get('/:slug', async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const key = String(req.params.slug);
        const row = /^\d+$/.test(key)
            ? await db.findOne("SELECT * FROM team_members WHERE id = ? AND status = 'active'", [parseInt(key, 10)])
            : await db.findOne("SELECT * FROM team_members WHERE slug = ? AND status = 'active'", [key]);
        if (!row) return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        res.set('Cache-Control', 'no-cache');
        res.json({ success: true, data: fromRow(row) });
    } catch (e) {
        logger.error('Get team member error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Admin: thêm
router.post('/', adminOnly, async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const body = Object.assign({}, req.body);
        if (!body.full_name || !String(body.full_name).trim()) {
            return res.status(400).json({ success: false, message: 'Thiếu họ tên' });
        }
        body.slug = slugify(body.slug || body.full_name);
        if (!body.slug) return res.status(400).json({ success: false, message: 'Slug không hợp lệ' });

        const dup = await db.findOne('SELECT id FROM team_members WHERE slug = ?', [body.slug]);
        if (dup) return res.status(409).json({ success: false, message: 'Slug "' + body.slug + '" đã tồn tại' });

        const id = await db.insert('team_members', toRow(body, true));
        res.status(201).json({ success: true, message: 'Đã thêm thành viên', data: { id, slug: body.slug } });
    } catch (e) {
        logger.error('Create team member error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm thành viên' });
    }
});

// Admin: cập nhật
router.put('/:id', adminOnly, async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const id = parseInt(req.params.id, 10);
        const existing = await db.findOne('SELECT id, slug FROM team_members WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });

        const body = Object.assign({}, req.body);
        delete body.id;
        if (body.full_name !== undefined && !String(body.full_name).trim()) {
            return res.status(400).json({ success: false, message: 'Họ tên không được để trống' });
        }
        if (body.slug !== undefined) {
            body.slug = slugify(body.slug);
            if (!body.slug) return res.status(400).json({ success: false, message: 'Slug không hợp lệ' });
            if (body.slug !== existing.slug) {
                const dup = await db.findOne('SELECT id FROM team_members WHERE slug = ? AND id <> ?', [body.slug, id]);
                if (dup) return res.status(409).json({ success: false, message: 'Slug "' + body.slug + '" đã tồn tại' });
            }
        }

        const row = toRow(body, false);
        row.updated_at = new Date();
        await db.update('team_members', row, 'id = ?', [id]);
        res.json({ success: true, message: 'Đã cập nhật thành viên' });
    } catch (e) {
        logger.error('Update team member error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật' });
    }
});

// Admin: xóa
router.delete('/:id', adminOnly, async (req, res) => {
    if (!(await readyOr500(res))) return;
    try {
        const id = parseInt(req.params.id, 10);
        const existing = await db.findOne('SELECT id FROM team_members WHERE id = ?', [id]);
        if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy thành viên' });
        await db.delete('team_members', 'id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa thành viên' });
    } catch (e) {
        logger.error('Delete team member error:', { error: e.message });
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa' });
    }
});

module.exports = router;
module.exports.slugify = slugify;
