/**
 * Update Admin Profile with Real Data
 * Cập nhật thông tin thật cho tài khoản admin
 */

require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
    user: process.env.MSSQL_USER || 'clb_admin',
    password: process.env.MSSQL_PASSWORD || 'CLB@Hutech2026!',
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

// Thông tin admin thật
const adminData = {
    email: 'admin@vocotruyenhutech.edu.vn',
    username: 'admin_hutech',
    password: 'VoCT@Hutech2026!',
    first_name: 'Quản Trị',
    last_name: 'Viên',
    full_name: 'Quản Trị Viên CLB',
    phone_number: '0283.989.0124',
    gender: 'male',
    address: 'Trường Đại học Công nghệ TP.HCM (HUTECH), 475A Điện Biên Phủ, P.25, Q.Bình Thạnh, TP.HCM',
    role: 'admin',
    membership_status: 'active',
    is_active: true,
    email_verified: true
};

async function updateAdminProfile() {
    let pool;
    try {
        console.log('🔄 Updating admin profile with real data...\n');
        
        pool = await sql.connect(config);
        console.log('✅ Connected to database!\n');

        // Check if new email already exists (for different user)
        const existingEmail = await pool.request()
            .input('email', sql.NVarChar, adminData.email)
            .query('SELECT id FROM users WHERE email = @email');

        let adminId;

        if (existingEmail.recordset.length > 0) {
            // Update existing admin
            adminId = existingEmail.recordset[0].id;
            console.log(`📝 Updating existing admin (ID: ${adminId})...\n`);
        } else {
            // Get current test admin
            const testAdmin = await pool.request()
                .input('email', sql.NVarChar, 'admin@test.com')
                .query('SELECT id FROM users WHERE email = @email');

            if (testAdmin.recordset.length > 0) {
                adminId = testAdmin.recordset[0].id;
                console.log(`📝 Updating test admin to real admin (ID: ${adminId})...\n`);
            } else {
                console.log('❌ No admin account found to update!');
                return;
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(adminData.password, 10);

        // Update admin profile
        await pool.request()
            .input('id', sql.Int, adminId)
            .input('email', sql.NVarChar, adminData.email)
            .input('username', sql.NVarChar, adminData.username)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('firstName', sql.NVarChar, adminData.first_name)
            .input('lastName', sql.NVarChar, adminData.last_name)
            .input('fullName', sql.NVarChar, adminData.full_name)
            .input('phoneNumber', sql.NVarChar, adminData.phone_number)
            .input('gender', sql.NVarChar, adminData.gender)
            .input('address', sql.NVarChar, adminData.address)
            .input('role', sql.NVarChar, adminData.role)
            .input('membershipStatus', sql.NVarChar, adminData.membership_status)
            .input('isActive', sql.Bit, adminData.is_active)
            .input('emailVerified', sql.Bit, adminData.email_verified)
            .query(`
                UPDATE users 
                SET 
                    email = @email,
                    username = @username,
                    password_hash = @passwordHash,
                    first_name = @firstName,
                    last_name = @lastName,
                    full_name = @fullName,
                    phone_number = @phoneNumber,
                    gender = @gender,
                    address = @address,
                    role = @role,
                    membership_status = @membershipStatus,
                    is_active = @isActive,
                    email_verified = @emailVerified,
                    updated_at = GETDATE()
                WHERE id = @id
            `);

        console.log('✅ Admin profile updated successfully!\n');

        // Get updated admin info
        const updatedAdmin = await pool.request()
            .input('id', sql.Int, adminId)
            .query('SELECT * FROM users WHERE id = @id');

        const admin = updatedAdmin.recordset[0];

        console.log('═'.repeat(80));
        console.log('ADMIN PROFILE - THÔNG TIN QUẢN TRỊ VIÊN');
        console.log('═'.repeat(80));
        console.log('');
        console.log('📋 Thông Tin Cá Nhân:');
        console.log('─'.repeat(80));
        console.log(`ID: ${admin.id}`);
        console.log(`Họ Tên: ${admin.full_name}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Username: ${admin.username}`);
        console.log(`Số Điện Thoại: ${admin.phone_number}`);
        console.log(`Giới Tính: ${admin.gender === 'male' ? 'Nam' : 'Nữ'}`);
        console.log(`Địa Chỉ: ${admin.address}`);
        console.log('');
        console.log('🔐 Thông Tin Tài Khoản:');
        console.log('─'.repeat(80));
        console.log(`Vai Trò: ${admin.role}`);
        console.log(`Trạng Thái: ${admin.membership_status}`);
        console.log(`Kích Hoạt: ${admin.is_active ? 'Có' : 'Không'}`);
        console.log(`Email Xác Thực: ${admin.email_verified ? 'Có' : 'Không'}`);
        console.log(`Ngày Tạo: ${admin.created_at}`);
        console.log(`Cập Nhật: ${admin.updated_at}`);
        console.log('');
        console.log('═'.repeat(80));
        console.log('THÔNG TIN ĐĂNG NHẬP MỚI');
        console.log('═'.repeat(80));
        console.log('');
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Password: ${adminData.password}`);
        console.log('');
        console.log('💡 Lưu ý:');
        console.log('- Mật khẩu mới đã được cập nhật');
        console.log('- Vui lòng sử dụng thông tin mới để đăng nhập');
        console.log('- Email cũ (admin@test.com) không còn hoạt động');
        console.log('');
        console.log('🌐 Truy cập:');
        console.log('- Dashboard: http://localhost:3001/dashboard/admin-user-management.html');
        console.log('- Login: http://localhost:3001/website/views/account/dang-nhap.html');
        console.log('');
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run
updateAdminProfile().then(() => process.exit(0));
