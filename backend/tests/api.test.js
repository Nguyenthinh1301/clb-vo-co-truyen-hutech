/**
 * Test API — không cần database thật (config/db được thay bằng tests/helpers/fakeDb.js).
 * Bao phủ các lỗi đã từng xảy ra trên production để chúng không quay lại:
 *  - lộ tin nháp, lộ chi tiết lỗi DB, endpoint debug công khai
 *  - rate limit dùng chung giữa người dùng sau proxy, /api/v1/auth/login không bị giới hạn
 *  - thống kê liên hệ lỗi 500 trên PostgreSQL (SQL riêng của MSSQL)
 *  - quy tắc khóa / xóa / hạ quyền thành viên
 * Chạy: npm test
 */
jest.mock('../config/db', () => require('./helpers/fakeDb'));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const app = require('../server');

const token = (userId, secret = process.env.JWT_SECRET) => jwt.sign({ userId }, secret);
const ADMIN = token(1);
const STUDENT = token(2);
const FORGED = token(1, 'sai-secret');

// Mỗi request mang 1 "IP thật" qua header Cloudflare; X-Forwarded-For là IP proxy dùng chung
let ipSeq = 0;
const nextIp = () => `198.51.100.${(++ipSeq % 250) + 1}`;
function api(method, url, { tok, ip = nextIp() } = {}) {
    const r = request(app)[method](url).set('CF-Connecting-IP', ip).set('X-Forwarded-For', '10.0.0.1');
    return tok ? r.set('Authorization', 'Bearer ' + tok) : r;
}
const lastNewsQuery = () => db.queries.filter(q => /FROM news WHERE/.test(q.sql)).pop();

beforeEach(() => db.reset());

describe('CMS tin tức — không lộ bản nháp', () => {
    test('khách gửi ?status=draft vẫn chỉ nhận tin đã đăng', async () => {
        await api('get', '/api/cms/news?status=draft&q=a1');
        expect(lastNewsQuery().p[0]).toBe('published');
    });
    test('admin lọc được bản nháp và response không cho cache công khai', async () => {
        const r = await api('get', '/api/cms/news?status=draft&q=a2', { tok: ADMIN });
        expect(lastNewsQuery().p[0]).toBe('draft');
        expect(r.headers['cache-control']).toMatch(/no-store/);
    });
    test('học viên và token giả mạo chỉ thấy tin đã đăng', async () => {
        await api('get', '/api/cms/news?status=draft&q=a3', { tok: STUDENT });
        expect(lastNewsQuery().p[0]).toBe('published');
        await api('get', '/api/cms/news?status=draft&q=a4', { tok: FORGED });
        expect(lastNewsQuery().p[0]).toBe('published');
    });
    test('xem chi tiết: bản nháp → 404 với khách, 200 với admin', async () => {
        expect((await api('get', '/api/cms/news/2')).status).toBe(404);
        expect((await api('get', '/api/cms/news/1')).status).toBe(200);
        expect((await api('get', '/api/cms/news/2', { tok: ADMIN })).status).toBe(200);
    });
    test('lỗi DB chỉ trả thông báo chung, không lộ chi tiết', async () => {
        const r = await api('get', '/api/cms/events/5');
        expect(r.status).toBe(500);
        expect(JSON.stringify(r.body)).not.toMatch(/internal secret/);
    });
});

describe('Endpoint /health', () => {
    test('/health công khai', async () => {
        expect((await api('get', '/health')).status).toBe(200);
    });
    test('/health/smtp-test đã bị xóa', async () => {
        expect((await api('get', '/health/smtp-test')).status).toBe(404);
    });
    test.each(['/health/detailed', '/health/database-stats'])('%s cần quyền admin', async (url) => {
        expect((await api('get', url)).status).toBe(401);
        expect((await api('get', url, { tok: STUDENT })).status).toBe(403);
    });
    test('POST /health/mssql-optimize cần đăng nhập', async () => {
        expect((await api('post', '/health/mssql-optimize')).status).toBe(401);
    });
    test('/health/detailed với admin → 200', async () => {
        expect((await api('get', '/health/detailed', { tok: ADMIN })).status).toBe(200);
    });
});

describe('Rate limit theo IP thật', () => {
    const bad = { email: 'x@y.com', password: 'wrongpass' };
    test('đăng nhập sai lần thứ 21 qua /api/v1 bị chặn, dùng chung bộ đếm với /api/auth', async () => {
        const ip = '203.0.113.9';
        const codes = [];
        for (let i = 0; i < 21; i++) codes.push((await api('post', '/api/v1/auth/login', { ip }).send(bad)).status);
        expect(codes[19]).toBe(401);
        expect(codes[20]).toBe(429);
        expect((await api('post', '/api/auth/login', { ip }).send(bad)).status).toBe(429);
    });
    test('người dùng khác sau cùng proxy không bị khóa lây', async () => {
        expect((await api('post', '/api/v1/auth/login', { ip: '203.0.113.10' }).send(bad)).status).toBe(401);
    });
    test('mỗi IP thật có bộ đếm riêng', async () => {
        const a1 = await api('get', '/api/cms/reviews', { ip: '203.0.113.20' });
        const a2 = await api('get', '/api/cms/reviews', { ip: '203.0.113.20' });
        const b1 = await api('get', '/api/cms/reviews', { ip: '203.0.113.21' });
        const rem = r => parseInt(r.headers['ratelimit-remaining']);
        expect(rem(a2)).toBe(rem(a1) - 1);
        expect(rem(b1)).toBe(rem(a1));
    });
});

describe('Thống kê liên hệ (Dashboard)', () => {
    test('trả số liệu đúng, không dùng SQL riêng của MSSQL', async () => {
        const r = await api('get', '/api/contact/stats/overview', { tok: ADMIN });
        expect(r.status).toBe(200);
        expect(r.body.data.overall).toMatchObject({
            total_messages: 5, new_messages: 2, replied_messages: 3, avg_response_time_hours: 3
        });
        expect(db.queries.some(q => /DATEDIFF\(HOUR/i.test(q.sql))).toBe(false);
    });
    test('không có token → 401', async () => {
        expect((await api('get', '/api/contact/stats/overview')).status).toBe(401);
    });
});

describe('Quản lý thành viên', () => {
    test('không tự xóa / tự khóa / tự hạ quyền chính mình', async () => {
        expect((await api('delete', '/api/users/1/delete', { tok: ADMIN })).status).toBe(400);
        expect((await api('delete', '/api/users/1', { tok: ADMIN })).status).toBe(400);
        expect((await api('put', '/api/users/1', { tok: ADMIN }).send({ role: 'student' })).status).toBe(400);
    });
    test('tự sửa thông tin cá nhân (không đổi vai trò) vẫn được', async () => {
        const r = await api('put', '/api/users/1', { tok: ADMIN }).send({ first_name: 'Tên', membership_status: 'active' });
        expect(r.status).toBe(200);
    });
    test('khóa và xóa được admin khác', async () => {
        expect((await api('delete', '/api/users/3', { tok: ADMIN })).status).toBe(200);
        expect((await api('delete', '/api/users/3/delete', { tok: ADMIN })).status).toBe(200);
        expect(db.deleted).toContain(3);
    });
    test('xóa học viên', async () => {
        expect((await api('delete', '/api/users/2/delete', { tok: ADMIN })).status).toBe(200);
        expect(db.deleted).toContain(2);
    });
    test('tài khoản còn dữ liệu liên quan → 409 gợi ý Khóa (không phải 500)', async () => {
        const r = await api('delete', '/api/users/5/delete', { tok: ADMIN });
        expect(r.status).toBe(409);
        expect(r.body.message).toMatch(/Khóa/);
    });
    test('học viên không có quyền xóa', async () => {
        expect((await api('delete', '/api/users/2/delete', { tok: STUDENT })).status).toBe(403);
    });
});
