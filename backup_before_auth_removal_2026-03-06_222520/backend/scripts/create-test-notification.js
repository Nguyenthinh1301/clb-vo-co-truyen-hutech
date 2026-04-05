/**
 * Script to manually create test notification for admin
 * This bypasses the NotificationService to test direct database insertion
 */

const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function createTestNotifications() {
    try {
        console.log('🔍 Creating test notifications for all registered users...\n');
        
        await sql.connect(config);
        console.log('✅ Connected to MSSQL database\n');
        
        // Get admin user
        const adminResult = await sql.query`
            SELECT id, email, full_name
            FROM users
            WHERE role = 'admin'
        `;
        
        if (adminResult.recordset.length === 0) {
            console.log('❌ No admin users found');
            return;
        }
        
        const admin = adminResult.recordset[0];
        console.log(`👑 Admin found: ${admin.email} (ID: ${admin.id})\n`);
        
        // Get all student users
        const studentsResult = await sql.query`
            SELECT id, email, first_name, last_name, full_name, phone_number, created_at
            FROM users
            WHERE role = 'student'
            ORDER BY created_at DESC
        `;
        
        if (studentsResult.recordset.length === 0) {
            console.log('❌ No student users found');
            return;
        }
        
        console.log(`📋 Found ${studentsResult.recordset.length} student(s)\n`);
        
        // Create notification for each student
        for (const student of studentsResult.recordset) {
            console.log(`📬 Creating notification for: ${student.full_name || student.email}`);
            
            const title = '🎉 Thành viên mới đăng ký';
            const message = `${student.full_name || student.email} vừa đăng ký tài khoản mới.\n\n` +
                           `📧 Email: ${student.email}\n` +
                           `👤 Tên: ${student.first_name} ${student.last_name}\n` +
                           `📱 SĐT: ${student.phone_number || 'Chưa cập nhật'}\n` +
                           `📅 Ngày đăng ký: ${new Date(student.created_at).toLocaleString('vi-VN')}\n\n` +
                           `Vui lòng kiểm tra và phân công lớp học cho thành viên mới.`;
            
            // Insert notification for admin
            await sql.query`
                INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
                VALUES (${admin.id}, 'info', ${title}, ${message}, 0, GETDATE())
            `;
            
            console.log(`   ✅ Notification created for admin\n`);
        }
        
        // Check all notifications
        console.log('\n📬 All notifications in database:');
        console.log('='.repeat(80));
        const allNotifications = await sql.query`
            SELECT id, user_id, title, type, is_read, created_at
            FROM notifications
            ORDER BY created_at DESC
        `;
        
        allNotifications.recordset.forEach((notif, index) => {
            console.log(`\n${index + 1}. ID: ${notif.id} | User: ${notif.user_id} | Type: ${notif.type}`);
            console.log(`   Title: ${notif.title}`);
            console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
            console.log(`   Created: ${notif.created_at}`);
        });
        
        console.log('\n✅ All notifications created successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sql.close();
    }
}

createTestNotifications();
