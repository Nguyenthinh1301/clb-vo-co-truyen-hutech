/**
 * Phân cấp quản trị
 *   owner  — Quản trị chính: toàn quyền (thành viên, tác vụ tự động, sao lưu, nhật ký, phân quyền)
 *   editor — Biên tập viên: chỉ quản lý nội dung (tin tức, sự kiện, thư viện, hoạt động, đội ngũ, cảm nhận, liên hệ)
 *
 * Lưu ở bảng riêng admin_roles (user_id, level) — không đổi bảng users (cột role có ràng buộc CHECK).
 * Lần đầu tạo bảng: Admin có email trong ADMIN_OWNER_EMAILS (mặc định: Nguyễn Quốc An) → owner,
 * các Admin khác → editor.
 * Admin được cấp quyền sau này mà chưa có dòng trong bảng → mặc định editor.
 */
const db = require('../config/db');

const DB_TYPE = (process.env.DB_TYPE || 'mysql').toLowerCase();
const LEVELS  = ['owner', 'editor'];
const LEVEL_LBL = { owner: 'Quản trị chính', editor: 'Biên tập viên' };

// Email tài khoản Quản trị chính (admin tổng) — mặc định: tài khoản Nguyễn Quốc An (admin@vocotruyenhutech.edu.vn).
// Có thể đổi bằng biến môi trường ADMIN_OWNER_EMAILS (nhiều email cách nhau bằng dấu phẩy).
const OWNER_EMAILS = String(process.env.ADMIN_OWNER_EMAILS || 'admin@vocotruyenhutech.edu.vn')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const DDL = {
    mssql: `
IF OBJECT_ID('admin_roles', 'U') IS NULL
CREATE TABLE admin_roles (
    user_id     INT NOT NULL PRIMARY KEY,
    level       NVARCHAR(20) NOT NULL DEFAULT 'editor',
    updated_by  INT NULL,
    updated_at  DATETIME NULL
)`,
    postgres: `
CREATE TABLE IF NOT EXISTS admin_roles (
    user_id     INT PRIMARY KEY,
    level       VARCHAR(20) NOT NULL DEFAULT 'editor',
    updated_by  INT,
    updated_at  TIMESTAMP
)`,
    mysql: `
CREATE TABLE IF NOT EXISTS admin_roles (
    user_id     INT PRIMARY KEY,
    level       VARCHAR(20) NOT NULL DEFAULT 'editor',
    updated_by  INT,
    updated_at  DATETIME
)`
};

let ready = null;
let cache = null;          // Map user_id → level
let cacheAt = 0;
const CACHE_MS = 20000;

function ensureTable() {
    if (!ready) {
        ready = (async () => {
            const ddl = DB_TYPE === 'mssql' ? DDL.mssql
                      : (DB_TYPE === 'postgres' || DB_TYPE === 'postgresql') ? DDL.postgres : DDL.mysql;
            await db.query(ddl);
            // Lần đầu (bảng trống): chỉ tài khoản trong ADMIN_OWNER_EMAILS là Quản trị chính,
            // các Admin khác là Biên tập viên. Không tìm thấy email nào → mọi Admin là Quản trị chính (tránh khóa ngoài).
            const cnt = await db.find('SELECT COUNT(*) AS c FROM admin_roles', []);
            if (!(parseInt(cnt && cnt[0] && cnt[0].c, 10) > 0)) {
                const admins = await db.find("SELECT id, email FROM users WHERE role = 'admin'", []);
                const ownerSet = new Set(OWNER_EMAILS);
                const hasOwner = admins.some(a => ownerSet.has(String(a.email || '').toLowerCase()));
                for (const a of admins) {
                    const level = !hasOwner || ownerSet.has(String(a.email || '').toLowerCase()) ? 'owner' : 'editor';
                    await db.query('INSERT INTO admin_roles (user_id, level, updated_at) VALUES (?, ?, ?)',
                        [a.id, level, new Date()]).catch(() => {});
                    console.log(`[adminRoles] Khởi tạo: ${a.email} → ${LEVEL_LBL[level]}`);
                }
                if (!hasOwner && admins.length) {
                    console.warn('[adminRoles] Không tìm thấy Admin nào có email trong ADMIN_OWNER_EMAILS (' +
                        OWNER_EMAILS.join(', ') + ') → tạm đặt mọi Admin là Quản trị chính');
                }
            }
        })().catch(e => { ready = null; throw e; });
    }
    return ready;
}

async function loadAll(force) {
    if (!force && cache && Date.now() - cacheAt < CACHE_MS) return cache;
    await ensureTable();
    const rows = await db.find('SELECT user_id, level FROM admin_roles', []);
    cache = new Map(rows.map(r => [parseInt(r.user_id, 10), LEVELS.includes(r.level) ? r.level : 'editor']));
    cacheAt = Date.now();
    return cache;
}

/** Cấp của một Admin (mặc định editor nếu chưa có dòng) */
async function getLevel(userId) {
    const m = await loadAll(false);
    return m.get(parseInt(userId, 10)) || 'editor';
}

async function setLevel(userId, level, byUserId) {
    if (!LEVELS.includes(level)) throw new Error('Cấp quản trị không hợp lệ');
    await ensureTable();
    const id = parseInt(userId, 10);
    const exists = await db.findOne('SELECT user_id FROM admin_roles WHERE user_id = ?', [id]);
    if (exists) {
        await db.update('admin_roles', { level, updated_by: byUserId || null, updated_at: new Date() }, 'user_id = ?', [id]);
    } else {
        await db.query('INSERT INTO admin_roles (user_id, level, updated_by, updated_at) VALUES (?, ?, ?, ?)',
            [id, level, byUserId || null, new Date()]);
    }
    await loadAll(true);
}

/** Xóa cấp quản trị (khi tài khoản bị hạ khỏi Admin hoặc bị xóa) — cấp lại Admin sau này sẽ về mặc định Biên tập viên */
async function clearLevel(userId) {
    await ensureTable();
    await db.delete('admin_roles', 'user_id = ?', [parseInt(userId, 10)]);
    await loadAll(true);
}

/** true nếu userId là Quản trị chính cuối cùng đang hoạt động */
async function isLastOwner(userId) {
    return (await getLevel(userId)) === 'owner' && (await countOtherActiveOwners(userId)) === 0;
}

/** Số Quản trị chính đang hoạt động, không tính excludeId */
async function countOtherActiveOwners(excludeId) {
    const m = await loadAll(true);
    const admins = await db.find("SELECT id FROM users WHERE role = 'admin' AND is_active = true", []);
    return admins.filter(a => parseInt(a.id, 10) !== parseInt(excludeId, 10) && m.get(parseInt(a.id, 10)) === 'owner').length;
}

/** Map user_id → level cho tất cả Admin (dùng ở trang Thành viên) */
async function listLevels() {
    const m = await loadAll(false);
    const admins = await db.find("SELECT id FROM users WHERE role = 'admin'", []);
    const out = {};
    admins.forEach(a => { out[a.id] = m.get(parseInt(a.id, 10)) || 'editor'; });
    return out;
}

module.exports = { ensureTable, getLevel, setLevel, clearLevel, isLastOwner, countOtherActiveOwners, listLevels, LEVELS, LEVEL_LBL };
