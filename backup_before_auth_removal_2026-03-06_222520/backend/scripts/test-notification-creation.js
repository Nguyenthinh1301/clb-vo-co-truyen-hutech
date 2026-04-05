const sql = require('mssql');
const NotificationService = require('../services/notificationService');
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

async function testNotificationCreation() {
    try {
        console.log('🔍 Testing notification creation...\n');
        
        // Connect to database
        await sql.connect(config);
        console.log('✅ Connected to database\n');
        
        // Get the latest registered user
        const result = await sql.query`
            SELECT TOP 1 id, email, first_name, last_name, full_name, phone_number, created_at
            FROM users
            WHERE role = 'student'
            ORDER BY created_at DESC
        `;
        
        if (result.recordset.length === 0) {
            console.log('❌ No student users found');
            return;
        }
        
        const user = result.recordset[0];
        console.log('📋 Latest registered user:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Full Name: ${user.full_name}`);
        console.log(`   Created: ${user.created_at}\n`);
        
        // Try to create notification
        console.log('📬 Attempting to create notification for admins...\n');
        
        const notificationResult = await NotificationService.notifyNewUserRegistration(user);
        
        console.log('Result:', notificationResult);
        
        if (notificationResult.success) {
            console.log(`✅ Successfully created notification for ${notificationResult.recipientCount} admin(s)\n`);
            
            // Check notifications in database
            const notifications = await sql.query`
                SELECT TOP 5 id, user_id, title, message, type, is_read, created_at
                FROM notifications
                ORDER BY created_at DESC
            `;
            
            console.log('📬 Recent notifications in database:');
            notifications.recordset.forEach((notif, index) => {
                console.log(`\n${index + 1}. Notification ID: ${notif.id}`);
                console.log(`   User ID: ${notif.user_id}`);
                console.log(`   Title: ${notif.title}`);
                console.log(`   Type: ${notif.type}`);
                console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
                console.log(`   Created: ${notif.created_at}`);
            });
        } else {
            console.log('❌ Failed to create notification:', notificationResult.error || notificationResult.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await sql.close();
    }
}

testNotificationCreation();
