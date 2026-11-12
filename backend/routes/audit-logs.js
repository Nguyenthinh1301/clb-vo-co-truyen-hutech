/**
 * Nhật ký hoạt động (Admin)
 *   GET /api/audit-logs           — danh sách, lọc + phân trang
 *        ?page&limit&q&kind=(create|update|delete|auth|system)&table&user_id&from=YYYY-MM-DD&to=YYYY-MM-DD
 *   GET /api/audit-logs/filters   — giá trị cho bộ lọc (bảng, người thực hiện)
 */
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJwt, requireAdmin } = require('../middleware/auth');
const { ensureAuditTable } = require('../utils/auditLog');

router.use(authenticateJwt, requireAdmin);

const KIND_PATTERNS = {
    create: ['%created%', '%added%', '%registered%', '%enrolled%', '%recorded%'],
    update: ['%updated%', '%changed%', '%locked%', '%replied%'],
    delete: ['%deleted%', '%removed%'],
    auth:   ['user_login%', 'user_logout%', 'password_changed%']
};

function parseDay(s, endOfDay) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    // Ngày theo giờ Việt Nam (UTC+7)
    const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0);
    return new Date(utc - 7 * 3600 * 1000);
}

function parseJson(s) {
    if (s === null || s === undefined || s === '') return null;
    if (typeof s !== 'string') return s;
    try { return JSON.parse(s); } catch (e) { return s; }
}

router.get('/', async (req, res) => {
    try {
        await ensureAuditTable();
        const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
        const offset = (page - 1) * limit;

        const where = ['1=1'];
        const params = [];

        const kind = String(req.query.kind || '');
        if (kind === 'system') {
            where.push('a.user_id IS NULL');
        } else if (KIND_PATTERNS[kind]) {
            where.push('(' + KIND_PATTERNS[kind].map(() => 'a.action LIKE ?').join(' OR ') + ')');
            params.push(...KIND_PATTERNS[kind]);
        }
        if (req.query.table) { where.push('a.table_name = ?'); params.push(String(req.query.table)); }
        if (req.query.user_id && /^\d+$/.test(req.query.user_id)) {
            where.push('a.user_id = ?'); params.push(parseInt(req.query.user_id, 10));
        }
        const from = parseDay(req.query.from, false);
        const to   = parseDay(req.query.to, true);
        if (from) { where.push('a.created_at >= ?'); params.push(from); }
        if (to)   { where.push('a.created_at <= ?'); params.push(to); }

        const q = String(req.query.q || '').trim().toLowerCase();
        if (q) {
            const kw = '%' + q + '%';
            where.push(`(LOWER(a.action) LIKE ? OR LOWER(COALESCE(a.new_values, '')) LIKE ? OR LOWER(COALESCE(a.old_values, '')) LIKE ?
                        OR LOWER(COALESCE(u.email, '')) LIKE ? OR LOWER(COALESCE(a.ip_address, '')) LIKE ?)`);
            params.push(kw, kw, kw, kw, kw);
        }

        const W = where.join(' AND ');
        const rows = await db.find(
            `SELECT a.id, a.user_id, a.action, a.table_name, a.record_id, a.old_values, a.new_values,
                    a.ip_address, a.user_agent, a.created_at,
                    u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
                    u.username AS user_username, u.role AS user_role
             FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
             WHERE ${W}
             ORDER BY a.created_at DESC, a.id DESC
             LIMIT ${limit} OFFSET ${offset}`,
            params
        );
        const cnt = await db.findOne(
            `SELECT COUNT(*) AS cnt FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id WHERE ${W}`,
            params
        );

        res.set('Cache-Control', 'no-store');
        res.json({
            success: true,
            data: {
                logs: rows.map(r => Object.assign({}, r, {
                    old_values: parseJson(r.old_values),
                    new_values: parseJson(r.new_values)
                })),
                total: parseInt(cnt && cnt.cnt, 10) || 0,
                page, limit
            }
        });
    } catch (e) {
        console.error('[audit-logs] list error:', e.message);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy nhật ký: ' + e.message });
    }
});

router.get('/filters', async (req, res) => {
    try {
        await ensureAuditTable();
        const tables = await db.find(
            `SELECT table_name, COUNT(*) AS cnt FROM audit_logs WHERE table_name IS NOT NULL
             GROUP BY table_name ORDER BY table_name`, []);
        const users = await db.find(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.role, COUNT(*) AS cnt
             FROM audit_logs a JOIN users u ON u.id = a.user_id
             GROUP BY u.id, u.email, u.first_name, u.last_name, u.role
             ORDER BY COUNT(*) DESC`, []);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, data: { tables, users } });
    } catch (e) {
        console.error('[audit-logs] filters error:', e.message);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + e.message });
    }
});

module.exports = router;
