/**
 * Database giả cho test — thay thế config/db (jest.mock) để test chạy không cần DB thật.
 * Chỉ mô phỏng đúng những câu SQL mà các route đang test dùng tới.
 *
 * Người dùng mẫu: 1 = admin (người đăng nhập trong test), 2 = học viên,
 *                 3 = admin khác, 5 = học viên dính khóa ngoại (không xóa được)
 */
const SEED_USERS = () => ({
    1: { id: 1, email: 'admin1@test.vn',   role: 'admin',   is_active: true },
    2: { id: 2, email: 'student2@test.vn', role: 'student', is_active: true },
    3: { id: 3, email: 'admin3@test.vn',   role: 'admin',   is_active: true },
    5: { id: 5, email: 'student5@test.vn', role: 'student', is_active: true }
});
const NEWS = {
    1: { id: 1, title: 'Tin đã đăng', status: 'published' },
    2: { id: 2, title: 'Bản nháp',    status: 'draft' }
};

const db = {
    queries: [],     // mọi câu SQL đã chạy (để test kiểm tra tham số)
    deleted: [],     // id user đã bị xóa
    users: SEED_USERS(),

    reset() { this.queries = []; this.deleted = []; this.users = SEED_USERS(); },

    async findOne(sql, p = []) {
        this.queries.push({ sql, p });
        if (/COUNT\(\*\) as cnt FROM users WHERE role = 'admin'/.test(sql)) {
            const n = Object.values(this.users).filter(u => u.role === 'admin' && u.is_active && u.id !== p[0]).length;
            return { cnt: String(n) }; // PostgreSQL trả COUNT dạng chuỗi
        }
        if (/FROM users WHERE id = \?/.test(sql)) return this.users[p[0]] ? { ...this.users[p[0]] } : null;
        if (/FROM users WHERE \(email = \? OR username = \?\)/.test(sql)) return null; // đăng nhập luôn sai
        if (/FROM user_sessions/.test(sql)) return { id: 99, user_id: p[0] };       // phiên hợp lệ
        if (/FROM news WHERE id = \?/.test(sql)) return NEWS[p[0]] || null;
        if (/FROM events WHERE id = \?/.test(sql)) throw new Error('relation "events" internal secret detail');
        if (/COUNT\(\*\)/.test(sql)) return { cnt: 0, total: 0 };
        return null;
    },

    async find(sql, p = []) {
        this.queries.push({ sql, p });
        if (/DATEDIFF\(HOUR/i.test(sql)) throw new Error('function datediff does not exist'); // như PostgreSQL
        if (/FROM contact_messages[\s\S]*GROUP BY status/.test(sql)) return [{ status: 'new', count: '2' }, { status: 'replied', count: '3' }];
        if (/FROM contact_messages[\s\S]*replied_at IS NOT NULL/.test(sql)) return [
            { created_at: '2026-11-01T00:00:00Z', replied_at: '2026-11-01T02:00:00Z' },
            { created_at: '2026-11-02T00:00:00Z', replied_at: '2026-11-02T04:00:00Z' }
        ];
        if (/FROM contact_messages/.test(sql)) return [{ date: '2026-11-02', total_messages: 1, replied_messages: 1 }];
        return [];
    },

    async insert() { return 1; },
    async update() { return 1; },
    async delete(table, where, p = []) {
        if (table === 'users' && p[0] === 5) {
            const e = new Error('update or delete on table "users" violates foreign key constraint');
            e.code = '23503';
            throw e;
        }
        if (table === 'users') this.deleted.push(p[0]);
        return 1;
    },
    async query() { return []; },
    async testConnection() { return { success: true }; },
    async getStats() { return {}; },
    async close() {}
};

module.exports = db;
