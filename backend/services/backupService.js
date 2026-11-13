/**
 * Sao lưu dữ liệu — xuất các bảng nội dung ra JSON (nén gzip) và lưu vào bảng system_backups.
 *
 * - Không lưu mật khẩu / token / secret.
 * - Giữ tối đa BACKUP_KEEP bản gần nhất (mặc định 14).
 * - Admin tải bản sao lưu về máy từ trang Admin › Tác vụ tự động (nên tải định kỳ để có bản ngoài máy chủ).
 */
const zlib = require('zlib');
const db   = require('../config/db');

const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();
const KEEP    = parseInt(process.env.BACKUP_KEEP, 10) || 14;

// Các bảng được sao lưu (bảng nào không tồn tại sẽ được bỏ qua)
const TABLES = [
    'news', 'events', 'reviews', 'gallery_albums', 'gallery_photos', 'activities', 'team_members',
    'users', 'contact_messages', 'classes', 'class_enrollments', 'event_registrations', 'attendance'
];
const SECRET_COL = /pass(word)?|token|secret|otp|two_factor/i;

const DDL = {
    mssql: `
IF OBJECT_ID('system_backups', 'U') IS NULL
CREATE TABLE system_backups (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    trigger_by  NVARCHAR(30)  NULL,
    size_bytes  INT NULL,
    summary     NVARCHAR(MAX) NULL,
    data        NVARCHAR(MAX) NULL,
    created_at  DATETIME NOT NULL DEFAULT GETDATE()
)`,
    postgres: `
CREATE TABLE IF NOT EXISTS system_backups (
    id          SERIAL PRIMARY KEY,
    trigger_by  VARCHAR(30),
    size_bytes  INT,
    summary     TEXT,
    data        TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
)`,
    mysql: `
CREATE TABLE IF NOT EXISTS system_backups (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    trigger_by  VARCHAR(30),
    size_bytes  INT,
    summary     LONGTEXT,
    data        LONGTEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4`
};

let ready = null;
function ensureTable() {
    if (!ready) {
        const ddl = DB_TYPE === 'mssql' ? DDL.mssql
                  : (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') ? DDL.postgres : DDL.mysql;
        ready = db.query(ddl).catch(e => { ready = null; throw e; });
    }
    return ready;
}

function stripSecrets(row) {
    const out = {};
    Object.keys(row).forEach(k => { if (!SECRET_COL.test(k)) out[k] = row[k]; });
    return out;
}

/** Tạo bản sao lưu mới. Trả về { id, size_bytes, summary, total_rows } */
async function createBackup(triggerBy) {
    await ensureTable();
    const dump = { created_at: new Date().toISOString(), db_type: DB_TYPE, tables: {} };
    const summary = { tables: {}, skipped: [] };
    let totalRows = 0;

    for (const t of TABLES) {
        try {
            const rows = await db.find(`SELECT * FROM ${t}`, []);
            dump.tables[t] = rows.map(stripSecrets);
            summary.tables[t] = rows.length;
            totalRows += rows.length;
        } catch (e) {
            summary.skipped.push(t); // bảng chưa có trên CSDL này
        }
    }

    const gz   = zlib.gzipSync(Buffer.from(JSON.stringify(dump), 'utf8'), { level: 9 });
    const data = gz.toString('base64');
    summary.total_rows = totalRows;

    const id = await db.insert('system_backups', {
        trigger_by: String(triggerBy || 'schedule').substring(0, 30),
        size_bytes: gz.length,
        summary:    JSON.stringify(summary),
        data,
        created_at: new Date()
    });

    const removed = await pruneOld();
    return { id, size_bytes: gz.length, summary, total_rows: totalRows, removed };
}

/** Xóa bớt bản cũ, chỉ giữ KEEP bản mới nhất. Trả về số bản đã xóa */
async function pruneOld() {
    const rows = await db.find('SELECT id FROM system_backups ORDER BY created_at DESC, id DESC', []);
    const old  = rows.slice(KEEP);
    for (const r of old) await db.delete('system_backups', 'id = ?', [r.id]);
    return old.length;
}

async function listBackups() {
    await ensureTable();
    const rows = await db.find(
        'SELECT id, trigger_by, size_bytes, summary, created_at FROM system_backups ORDER BY created_at DESC, id DESC', []);
    return rows.map(r => {
        let s = null;
        try { s = JSON.parse(r.summary); } catch (e) { /* bỏ qua */ }
        return { id: r.id, trigger_by: r.trigger_by, size_bytes: r.size_bytes, summary: s, created_at: r.created_at };
    });
}

/** Lấy nội dung JSON (đã giải nén) của một bản sao lưu */
async function getBackupJson(id) {
    await ensureTable();
    const row = await db.findOne('SELECT id, data, created_at FROM system_backups WHERE id = ?', [id]);
    if (!row) return null;
    const json = zlib.gunzipSync(Buffer.from(row.data, 'base64')).toString('utf8');
    return { id: row.id, created_at: row.created_at, json };
}

async function lastBackupAt() {
    await ensureTable();
    const r = await db.find('SELECT created_at FROM system_backups ORDER BY created_at DESC, id DESC LIMIT 1', []);
    return r && r[0] ? new Date(r[0].created_at) : null;
}

module.exports = { createBackup, listBackups, getBackupJson, lastBackupAt, ensureTable, KEEP, TABLES };
