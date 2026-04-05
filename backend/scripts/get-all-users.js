/**
 * Get all users from MSSQL database
 * Script để lấy danh sách tất cả user trong database
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

async function getAllUsers() {
    let pool;
    try {
        console.log('🔍 Connecting to MSSQL database...\n');
        
        pool = await sql.connect(config);
        console.log('✅ Connected!\n');

        // Get all users
        const result = await pool.request().query(`
            SELECT 
                id, email, username, first_name, last_name, full_name,
                phone_number, role, membership_status, is_active,
                email_verified, created_at, last_login_at
            FROM users
            ORDER BY created_at DESC
        `);

        console.log(`📊 Total Users: ${result.recordset.length}\n`);
        console.log('═'.repeat(100));

        if (result.recordset.length === 0) {
            console.log('❌ No users found in database!\n');
            return;
        }

        // Group by role
        const byRole = {
            admin: [],
            instructor: [],
            student: [],
            other: []
        };

        result.recordset.forEach(user => {
            const role = user.role || 'other';
            if (byRole[role]) {
                byRole[role].push(user);
            } else {
                byRole.other.push(user);
            }
        });

        // Display by role
        console.log('\n👑 ADMIN ACCOUNTS:');
        console.log('─'.repeat(100));
        if (byRole.admin.length === 0) {
            console.log('No admin accounts found');
        } else {
            byRole.admin.forEach((user, i) => {
                console.log(`${i + 1}. ${user.email}`);
                console.log(`   Name: ${user.full_name || `${user.first_name} ${user.last_name}`}`);
                console.log(`   Status: ${user.membership_status} | Active: ${user.is_active ? 'Yes' : 'No'}`);
                console.log(`   Created: ${user.created_at}`);
                console.log('');
            });
        }

        console.log('\n👨‍🏫 INSTRUCTOR ACCOUNTS:');
        console.log('─'.repeat(100));
        if (byRole.instructor.length === 0) {
            console.log('No instructor accounts found');
        } else {
            byRole.instructor.forEach((user, i) => {
                console.log(`${i + 1}. ${user.email}`);
                console.log(`   Name: ${user.full_name || `${user.first_name} ${user.last_name}`}`);
                console.log(`   Status: ${user.membership_status} | Active: ${user.is_active ? 'Yes' : 'No'}`);
                console.log(`   Created: ${user.created_at}`);
                console.log('');
            });
        }

        console.log('\n👥 STUDENT ACCOUNTS:');
        console.log('─'.repeat(100));
        if (byRole.student.length === 0) {
            console.log('No student accounts found');
        } else {
            // Show first 20 students
            const studentsToShow = byRole.student.slice(0, 20);
            studentsToShow.forEach((user, i) => {
                console.log(`${i + 1}. ${user.email}`);
                console.log(`   Name: ${user.full_name || `${user.first_name} ${user.last_name}`}`);
                console.log(`   Phone: ${user.phone_number || 'N/A'}`);
                console.log(`   Status: ${user.membership_status} | Active: ${user.is_active ? 'Yes' : 'No'}`);
                console.log(`   Created: ${user.created_at}`);
                console.log('');
            });
            
            if (byRole.student.length > 20) {
                console.log(`... and ${byRole.student.length - 20} more students\n`);
            }
        }

        // Statistics
        console.log('\n📈 STATISTICS:');
        console.log('═'.repeat(100));
        console.log(`Total Users: ${result.recordset.length}`);
        console.log(`├─ Admins: ${byRole.admin.length}`);
        console.log(`├─ Instructors: ${byRole.instructor.length}`);
        console.log(`└─ Students: ${byRole.student.length}`);
        console.log('');
        
        const activeUsers = result.recordset.filter(u => u.is_active).length;
        const verifiedUsers = result.recordset.filter(u => u.email_verified).length;
        const pendingUsers = result.recordset.filter(u => u.membership_status === 'pending').length;
        
        console.log(`Active Users: ${activeUsers}`);
        console.log(`Email Verified: ${verifiedUsers}`);
        console.log(`Pending Approval: ${pendingUsers}`);

        // Export to JSON if requested
        if (process.argv.includes('--json')) {
            const fs = require('fs');
            const outputFile = 'users-export.json';
            fs.writeFileSync(outputFile, JSON.stringify(result.recordset, null, 2));
            console.log(`\n💾 Exported to ${outputFile}`);
        }

        console.log('\n' + '═'.repeat(100));
        console.log('✅ Check completed!');

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
getAllUsers().then(() => process.exit(0));
