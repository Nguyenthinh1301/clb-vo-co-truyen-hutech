/**
 * Safe audit log helper
 * Ghi audit log mà không làm crash request nếu bảng audit_logs chưa tồn tại
 */

const db = require('../config/db');

/**
 * @param {object} data - { user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent }
 */
async function auditLog(data) {
    try {
        await db.insert('audit_logs', {
            ...data,
            created_at: new Date()
        });
    } catch (err) {
        // Không throw - audit log là non-critical
        console.warn('[AuditLog] Skipped (table may not exist):', err.message);
    }
}

module.exports = auditLog;
