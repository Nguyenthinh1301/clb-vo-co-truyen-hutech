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

async function checkUsersAndNotifications() {
    try {
        console.log('🔍 Connecting to MSSQL database...');
        await sql.connect(config);
        console.log('✅ Connected successfully!\n');

        // Check all users
        console.log('📋 ALL USERS:');
        console.log('='.repeat(80));
        const usersResult = await sql.query`
            SELECT 
                id,
                username,
                email,
                first_name,
                last_name,
                full_name,
                role,
                membership_status,
                created_at
            FROM users
            ORDER BY created_at DESC
        `;
        
        if (usersResult.recordset.length === 0) {
            console.log('❌ No users found in database');
        } else {
            usersResult.recordset.forEach((user, index) => {
                console.log(`\n${index + 1}. User ID: ${user.id}`);
                console.log(`   Username: ${user.username}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Full Name: ${user.full_name || `${user.first_name} ${user.last_name}`}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.membership_status}`);
                console.log(`   Created: ${user.created_at}`);
            });
        }

        // Check notifications
        console.log('\n\n📬 ALL NOTIFICATIONS:');
        console.log('='.repeat(80));
        const notificationsResult = await sql.query`
            SELECT 
                id,
                user_id,
                title,
                message,
                type,
                is_read,
                created_at
            FROM notifications
            ORDER BY created_at DESC
        `;
        
        if (notificationsResult.recordset.length === 0) {
            console.log('❌ No notifications found in database');
        } else {
            notificationsResult.recordset.forEach((notif, index) => {
                console.log(`\n${index + 1}. Notification ID: ${notif.id}`);
                console.log(`   User ID: ${notif.user_id}`);
                console.log(`   Title: ${notif.title}`);
                console.log(`   Message: ${notif.message}`);
                console.log(`   Type: ${notif.type}`);
                console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
                console.log(`   Created: ${notif.created_at}`);
            });
        }

        // Check admin users
        console.log('\n\n👑 ADMIN USERS:');
        console.log('='.repeat(80));
        const adminsResult = await sql.query`
            SELECT id, username, email, full_name
            FROM users
            WHERE role = 'admin'
        `;
        
        if (adminsResult.recordset.length === 0) {
            console.log('❌ No admin users found');
        } else {
            adminsResult.recordset.forEach((admin, index) => {
                console.log(`${index + 1}. Admin ID: ${admin.id} - ${admin.email} (${admin.full_name || admin.username})`);
            });
        }

        // Check member users (non-admin)
        console.log('\n\n👥 MEMBER USERS (Non-Admin):');
        console.log('='.repeat(80));
        const membersResult = await sql.query`
            SELECT id, username, email, full_name, first_name, last_name, created_at
            FROM users
            WHERE role = 'member'
            ORDER BY created_at DESC
        `;
        
        if (membersResult.recordset.length === 0) {
            console.log('❌ No member users found');
        } else {
            membersResult.recordset.forEach((member, index) => {
                console.log(`\n${index + 1}. Member ID: ${member.id}`);
                console.log(`   Email: ${member.email}`);
                console.log(`   Full Name: ${member.full_name || `${member.first_name} ${member.last_name}`}`);
                console.log(`   Created: ${member.created_at}`);
            });
        }

        console.log('\n✅ Check completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

checkUsersAndNotifications();
