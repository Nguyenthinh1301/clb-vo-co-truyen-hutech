/**
 * Cleanup Users - Keep Only Admin
 * Xóa tất cả users trừ admin@test.com
 */

require('dotenv').config();
const sql = require('mssql');

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

async function cleanupUsers() {
    console.log('🧹 Cleaning up users...\n');
    
    try {
        await sql.connect(config);
        console.log('✅ Connected to MSSQL\n');
        
        // Get all users
        console.log('📋 Current users in database:');
        const allUsers = await sql.query`
            SELECT id, email, username, role, is_active
            FROM users
            ORDER BY id
        `;
        
        console.log(`Found ${allUsers.recordset.length} users:\n`);
        allUsers.recordset.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        // Find admin account
        const adminEmail = 'admin@test.com';
        const adminUser = allUsers.recordset.find(u => u.email === adminEmail);
        
        if (!adminUser) {
            console.log(`\n❌ Admin account (${adminEmail}) not found!`);
            console.log('Please create admin account first.');
            await sql.close();
            process.exit(1);
        }
        
        console.log(`\n✅ Admin account found: ID ${adminUser.id} (${adminUser.email})`);
        
        // Get users to delete (all except admin)
        const usersToDelete = allUsers.recordset.filter(u => u.email !== adminEmail);
        
        if (usersToDelete.length === 0) {
            console.log('\n✅ No users to delete. Only admin account exists.');
            await sql.close();
            process.exit(0);
        }
        
        console.log(`\n⚠️  Will delete ${usersToDelete.length} users:`);
        usersToDelete.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        // Confirm deletion
        console.log('\n🔴 Starting deletion in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Delete users one by one
        let deletedCount = 0;
        for (const user of usersToDelete) {
            try {
                // Delete related records first (if any)
                // Delete from login_attempts
                await sql.query`DELETE FROM login_attempts WHERE email = ${user.email}`;
                
                // Delete from user_sessions
                await sql.query`DELETE FROM user_sessions WHERE user_id = ${user.id}`;
                
                // Delete from audit_logs
                await sql.query`DELETE FROM audit_logs WHERE user_id = ${user.id}`;
                
                // Delete user
                await sql.query`DELETE FROM users WHERE id = ${user.id}`;
                
                console.log(`  ✅ Deleted: ${user.email} (ID: ${user.id})`);
                deletedCount++;
            } catch (error) {
                console.log(`  ❌ Failed to delete ${user.email}: ${error.message}`);
            }
        }
        
        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Deleted: ${deletedCount} users`);
        console.log(`   Kept: 1 admin account (${adminEmail})`);
        
        // Show remaining users
        console.log('\n📋 Remaining users:');
        const remainingUsers = await sql.query`
            SELECT id, email, username, role, is_active
            FROM users
            ORDER BY id
        `;
        
        remainingUsers.recordset.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        await sql.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

cleanupUsers();
