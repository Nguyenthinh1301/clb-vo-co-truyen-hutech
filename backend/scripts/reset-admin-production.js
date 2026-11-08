/**
 * Reset admin password trên Production (PostgreSQL/Neon)
 * Chạy: node scripts/reset-admin-production.js
 * Hoặc set env: DATABASE_URL=... node scripts/reset-admin-production.js
 *
 * Mật khẩu mới: lấy từ biến ADMIN_PASSWORD nếu có, nếu không thì SINH NGẪU NHIÊN
 * (không bao giờ dùng mật khẩu viết cứng trong code — repo này công khai).
 * Mật khẩu chỉ in ra 1 lần trên terminal: hãy lưu vào trình quản lý mật khẩu ngay.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetAdmin() {
    const email    = process.env.ADMIN_EMAIL || 'admin@vocotruyenhutech.edu.vn';
    // Ngẫu nhiên, luôn có chữ hoa + chữ thường + số để qua kiểm tra độ mạnh của trang đổi mật khẩu
    const password = process.env.ADMIN_PASSWORD
        || require('crypto').randomBytes(12).toString('base64url') + 'Aa1';

    try {
        console.log('🔌 Connecting to PostgreSQL (Neon)...');
        const client = await pool.connect();
        console.log('✅ Connected!\n');

        // Kiểm tra admin có tồn tại không
        const check = await client.query(
            'SELECT id, email, role FROM users WHERE email = $1',
            [email]
        );

        const hash = await bcrypt.hash(password, 12);

        if (check.rows.length === 0) {
            // Tạo mới admin
            console.log('⚠️  Admin chưa tồn tại — đang tạo mới...');
            await client.query(`
                INSERT INTO users (email, username, password, first_name, last_name, full_name,
                    role, membership_status, is_active, email_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                email, 'admin_vct', hash,
                'Quản Trị', 'Viên', 'Quản Trị Viên CLB',
                'admin', 'active', true, true
            ]);
            console.log('✅ Tạo admin thành công!');
        } else {
            // Cập nhật password
            console.log(`✅ Admin tồn tại (id=${check.rows[0].id}) — đang reset password...`);
            await client.query(
                'UPDATE users SET password = $1, is_active = true, updated_at = NOW() WHERE email = $2',
                [hash, email]
            );
            console.log('✅ Reset password thành công!');
        }

        client.release();
        console.log('\n' + '═'.repeat(50));
        console.log('🔑 Thông tin đăng nhập Admin:');
        console.log('═'.repeat(50));
        console.log(`Email   : ${email}`);
        console.log(`Password: ${password}`);
        console.log('═'.repeat(50));

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await pool.end();
    }
}

resetAdmin();
