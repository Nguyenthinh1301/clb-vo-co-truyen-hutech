/**
 * Script tạo tài khoản Admin
 * Chạy: node scripts/create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function createAdmin() {
    try {
        console.log('🔧 Đang tạo tài khoản Admin...\n');

        const adminData = {
            email: 'admin@vocotruyenhutech.edu.vn',
            username: 'admin',
            password: 'Admin@123', // Mật khẩu mặc định
            first_name: 'Admin',
            last_name: 'HUTECH',
            role: 'admin',
            phone: '0283 5445 7777',
            status: 'active',
            email_verified: true
        };

        // Check if admin already exists
        const existing = await db.findOne(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [adminData.email, adminData.username]
        );

        if (existing) {
            console.log('⚠️  Tài khoản admin đã tồn tại!');
            console.log('   Email:', existing.email);
            console.log('   Username:', existing.username);
            console.log('   Role:', existing.role);
            console.log('\n🔄 Đang reset mật khẩu về: Admin@123\n');

            // Reset password
            const hashedPassword = await bcrypt.hash(adminData.password, 10);
            await db.update(
                'users',
                {
                    password: hashedPassword,
                    role: 'admin',
                    status: 'active',
                    email_verified: true
                },
                'id = ?',
                [existing.id]
            );

            console.log('✅ Đã reset mật khẩu thành công!');
            console.log('\n📋 Thông tin đăng nhập:');
            console.log('   Email:', adminData.email);
            console.log('   Password:', adminData.password);
            console.log('   URL: http://localhost:3001/api/auth/login');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create admin user
        const userId = await db.insert('users', {
            ...adminData,
            password: hashedPassword
        });

        console.log('✅ Tạo tài khoản Admin thành công!');
        console.log('\n📋 Thông tin đăng nhập:');
        console.log('   Email:', adminData.email);
        console.log('   Username:', adminData.username);
        console.log('   Password:', adminData.password);
        console.log('   Role:', adminData.role);
        console.log('   User ID:', userId);
        console.log('\n🌐 URL đăng nhập:');
        console.log('   http://localhost:3001/api/auth/login');
        console.log('\n⚠️  LƯU Ý: Đổi mật khẩu sau khi đăng nhập lần đầu!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createAdmin();
