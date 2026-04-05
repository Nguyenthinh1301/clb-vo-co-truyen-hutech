/**
 * Test Send Notification Script
 * Script để test gửi thông báo từ admin đến user
 */

require('dotenv').config();
const db = require('../config/db');

async function testSendNotification() {
    console.log('🧪 Testing Send Notification Feature...\n');
    
    try {
        // 1. Check database connection
        console.log('1️⃣ Checking database connection...');
        const connectionTest = await db.testConnection();
        if (!connectionTest || !connectionTest.success) {
            console.error('❌ Database connection failed');
            process.exit(1);
        }
        console.log('✅ Database connected\n');
        
        // 2. Check if notifications table exists
        console.log('2️⃣ Checking notifications table...');
        try {
            const tableCheck = await db.query(
                "SELECT TOP 1 * FROM notifications",
                []
            );
            console.log('✅ Notifications table exists\n');
        } catch (error) {
            console.error('❌ Notifications table does not exist!');
            console.log('\n💡 Please run: backend/database/create-notifications-table.sql\n');
            process.exit(1);
        }
        
        // 3. Get admin user
        console.log('3️⃣ Finding admin user...');
        const admin = await db.findOne(
            "SELECT id, email, full_name FROM users WHERE role = 'admin'",
            []
        );
        
        if (!admin) {
            console.error('❌ No admin user found!');
            console.log('\n💡 Please create admin user first\n');
            process.exit(1);
        }
        console.log(`✅ Admin found: ${admin.email} (ID: ${admin.id})\n`);
        
        // 4. Get regular users
        console.log('4️⃣ Finding regular users...');
        const users = await db.query(
            "SELECT id, email, full_name, role FROM users WHERE role != 'admin'",
            []
        );
        
        if (users.length === 0) {
            console.error('❌ No regular users found!');
            console.log('\n💡 Please create some users first\n');
            process.exit(1);
        }
        console.log(`✅ Found ${users.length} users:\n`);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.role})`);
        });
        console.log('');
        
        // 5. Create test notification
        console.log('5️⃣ Creating test notification...');
        const testNotification = {
            user_id: users[0].id,
            type: 'general',
            priority: 'normal',
            title: 'Test Notification',
            message: 'This is a test notification from admin. If you see this, the notification system is working!',
            created_by: admin.id,
            is_read: 0
        };
        
        const notificationId = await db.insert('notifications', testNotification);
        console.log(`✅ Test notification created (ID: ${notificationId})\n`);
        
        // 6. Verify notification
        console.log('6️⃣ Verifying notification...');
        const notification = await db.findOne(
            'SELECT * FROM notifications WHERE id = ?',
            [notificationId]
        );
        
        if (notification) {
            console.log('✅ Notification verified:\n');
            console.log(`   To: ${users[0].email}`);
            console.log(`   From: ${admin.email}`);
            console.log(`   Title: ${notification.title}`);
            console.log(`   Type: ${notification.type}`);
            console.log(`   Priority: ${notification.priority}`);
            console.log(`   Created: ${notification.created_at}`);
            console.log('');
        }
        
        // 7. Test bulk send
        console.log('7️⃣ Testing bulk send to all users...');
        const bulkNotifications = users.map(user => ({
            user_id: user.id,
            type: 'system',
            priority: 'high',
            title: 'Welcome to CLB Võ Cổ Truyền HUTECH',
            message: 'Chào mừng bạn đến với hệ thống quản lý CLB. Đây là thông báo test từ admin.',
            created_by: admin.id,
            is_read: 0
        }));
        
        for (const notif of bulkNotifications) {
            await db.insert('notifications', notif);
        }
        console.log(`✅ Sent ${bulkNotifications.length} notifications\n`);
        
        // 8. Check total notifications
        console.log('8️⃣ Checking total notifications...');
        const totalResult = await db.findOne(
            'SELECT COUNT(*) as total FROM notifications',
            []
        );
        console.log(`✅ Total notifications in database: ${totalResult.total}\n`);
        
        // 9. Summary
        console.log('═══════════════════════════════════════');
        console.log('✅ ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('📝 Summary:');
        console.log(`   - Admin: ${admin.email}`);
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Notifications sent: ${bulkNotifications.length + 1}`);
        console.log('');
        console.log('🎉 Notification system is ready to use!');
        console.log('');
        console.log('Next steps:');
        console.log('   1. Start backend: npm start');
        console.log('   2. Login as admin');
        console.log('   3. Go to Notifications tab');
        console.log('   4. Send notification to users');
        console.log('');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testSendNotification();
