/**
 * Safe audit log helper — Nhật ký hoạt động
 * Ghi audit log mà không làm crash request nếu có lỗi.
 * Tự tạo bảng audit_logs nếu CSDL chưa có (MSSQL / PostgreSQL / MySQL).
 */

const db = require('../config/db');

const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();

const DDL = {
    mssql: `
IF OBJECT_ID('audit_logs', 'U') IS NULL
CREATE TABLE audit_logs (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT NULL,
    action      NVARCHAR(100) NOT NULL,
    table_name  NVARCHAR(100) NULL,
    record_id   INT NULL,
    old_values  NVARCHAR(MAX) NULL,
    new_values  NVARCHAR(MAX) NULL,
    ip_address  NVARCHAR(50)  NULL,
    user_agent  NVARCHAR(500) NULL,
    created_at  DATETIME NOT NULL DEFAULT GETDATE()
)`,
    postgres: `
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100),
    record_id   INT,
    old_values  TEXT,
    new_values  TEXT,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMP DEFAULT NOW()
)`,
    mysql: `
CREATE TABLE IF NOT EXISTS audit_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT,
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100),
    record_id   INT,
    old_values  LONGTEXT,
    new_values  LONGTEXT,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4`
};

let readyPromise = null;
function ensureAuditTable() {
    if (!readyPromise) {
        const ddl = DB_TYPE === 'mssql' ? DDL.mssql
                  : (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') ? DDL.postgres
                  : DDL.mysql;
        readyPromise = db.query(ddl).catch(err => {
            readyPromise = null;
            throw err;
        });
    }
    return readyPromise;
}

function toText(v, max) {
    if (v === undefined || v === null) return null;
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s.length > max ? s.substring(0, max) : s;
}

/**
 * @param {object} data - { user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent }
 *   old_values / new_values: object hoặc chuỗi JSON
 */
async function auditLog(data) {
    try {
        await ensureAuditTable();
        const recId = parseInt(data.record_id, 10);
        await db.insert('audit_logs', {
            user_id:    data.user_id || null,
            action:     String(data.action || 'unknown').substring(0, 100),
            table_name: data.table_name ? String(data.table_name).substring(0, 100) : null,
            record_id:  Number.isFinite(recId) ? recId : null,
            old_values: toText(data.old_values, 20000),
            new_values: toText(data.new_values, 20000),
            ip_address: data.ip_address ? String(data.ip_address).substring(0, 50) : null,
            user_agent: data.user_agent ? String(data.user_agent).substring(0, 500) : null,
            created_at: new Date()
        });
    } catch (err) {
        // Không throw - audit log là non-critical
        console.warn('[AuditLog] Skipped:', err.message);
    }
}

module.exports = auditLog;
module.exports.ensureAuditTable = ensureAuditTable;
