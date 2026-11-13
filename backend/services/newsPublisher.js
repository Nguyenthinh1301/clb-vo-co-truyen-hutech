/**
 * Đăng bài hẹn giờ — chuyển các tin tức status = 'scheduled' đã tới giờ (published_at <= bây giờ)
 * sang 'published'. Được gọi bởi:
 *   - tác vụ tự động "Đăng bài hẹn giờ" (mỗi phút, services/schedulerService.js)
 *   - mỗi lần có người xem danh sách / chi tiết tin tức (tối đa 1 lần / 30 giây) — phòng khi máy chủ vừa "ngủ dậy"
 */
const db       = require('../config/db');
const auditLog = require('../utils/auditLog');
const { cacheService } = require('./cacheService');

let lastRun = 0;
let running = null;

async function publishDue(force) {
    if (!force && Date.now() - lastRun < 30000) return { count: 0, titles: [] };
    if (running) return running;
    lastRun = Date.now();

    running = (async () => {
        const now  = new Date();
        const rows = await db.find(
            "SELECT id, title, published_at FROM news WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= ?",
            [now]);
        for (const n of rows) {
            await db.update('news', { status: 'published', updated_at: new Date() }, 'id = ?', [n.id]);
            await auditLog({
                user_id: null,
                action: 'news_auto_published',
                table_name: 'news',
                record_id: n.id,
                old_values: { title: n.title, status: 'scheduled', published_at: n.published_at },
                new_values: { title: n.title, status: 'published' }
            });
        }
        if (rows.length) cacheService.deletePattern('^cms:news');
        return { count: rows.length, titles: rows.map(r => r.title) };
    })();

    try { return await running; }
    finally { running = null; }
}

/**
 * Chuẩn hóa trạng thái + ngày đăng khi Admin lưu bài.
 * @param {string} status   'published' | 'draft' | 'scheduled'
 * @param {*} scheduledAt   thời điểm hẹn (ISO) — bắt buộc khi status = 'scheduled'
 * @param {object|null} existing  bản ghi hiện tại (khi sửa)
 * @returns {{ status, published_at } | { error }}
 */
function resolvePublishFields(status, scheduledAt, existing) {
    if (status === 'scheduled') {
        const t = scheduledAt ? new Date(scheduledAt) : null;
        if (!t || isNaN(t)) return { error: 'Vui lòng chọn thời gian hẹn đăng bài' };
        if (t.getTime() <= Date.now() + 30000) return { error: 'Thời gian hẹn đăng phải ở tương lai' };
        return { status: 'scheduled', published_at: t };
    }
    if (status === 'published') {
        // Giữ nguyên ngày đăng gốc khi sửa bài đã đăng
        if (existing && existing.status === 'published' && existing.published_at) {
            return { status: 'published', published_at: undefined };
        }
        return { status: 'published', published_at: new Date() };
    }
    if (status === 'draft') return { status: 'draft', published_at: null };
    return { status: status || 'draft', published_at: undefined };
}

module.exports = { publishDue, resolvePublishFields };
