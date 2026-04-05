/**
 * Sync users to admin dashboard
 * Script để đồng bộ danh sách user lên admin dashboard
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

async function syncUsers() {
    let pool;
    try {
        console.log('🔄 Starting user sync process...\n');
        
        pool = await sql.connect(config);
        console.log('✅ Connected to database!\n');

        // Get all pending users (chưa được phân lớp)
        const pendingUsers = await pool.request().query(`
            SELECT 
                u.id, u.email, u.username, u.first_name, u.last_name, u.full_name,
                u.phone_number, u.membership_status, u.created_at,
                COUNT(ce.id) as class_count
            FROM users u
            LEFT JOIN class_enrollments ce ON u.id = ce.user_id AND ce.status = 'active'
            WHERE u.role = 'student' AND u.is_active = 1
            GROUP BY u.id, u.email, u.username, u.first_name, u.last_name, u.full_name,
                     u.phone_number, u.membership_status, u.created_at
            HAVING COUNT(ce.id) = 0
            ORDER BY u.created_at DESC
        `);

        console.log('📋 USERS PENDING CLASS ASSIGNMENT:');
        console.log('═'.repeat(100));
        console.log(`Total: ${pendingUsers.recordset.length} users\n`);

        if (pendingUsers.recordset.length === 0) {
            console.log('✅ All users have been assigned to classes!\n');
        } else {
            pendingUsers.recordset.forEach((user, i) => {
                console.log(`${i + 1}. ${user.email}`);
                console.log(`   ID: ${user.id}`);
                console.log(`   Name: ${user.full_name || `${user.first_name} ${user.last_name}`}`);
                console.log(`   Phone: ${user.phone_number || 'N/A'}`);
                console.log(`   Status: ${user.membership_status}`);
                console.log(`   Registered: ${user.created_at}`);
                console.log('');
            });
        }

        // Get available classes
        const classes = await pool.request().query(`
            SELECT 
                c.id, c.name, c.schedule, c.location,
                c.max_students, c.current_students,
                u.first_name + ' ' + u.last_name as instructor_name
            FROM classes c
            LEFT JOIN users u ON c.instructor_id = u.id
            WHERE c.status = 'active'
            ORDER BY c.name
        `);

        console.log('\n📚 AVAILABLE CLASSES:');
        console.log('═'.repeat(100));
        console.log(`Total: ${classes.recordset.length} classes\n`);

        if (classes.recordset.length === 0) {
            console.log('⚠️  No active classes found! Please create classes first.\n');
        } else {
            classes.recordset.forEach((cls, i) => {
                const capacity = cls.max_students ? `${cls.current_students}/${cls.max_students}` : `${cls.current_students}/∞`;
                const available = cls.max_students ? (cls.max_students - cls.current_students) : '∞';
                
                console.log(`${i + 1}. ${cls.name} (ID: ${cls.id})`);
                console.log(`   Instructor: ${cls.instructor_name || 'N/A'}`);
                console.log(`   Schedule: ${cls.schedule || 'N/A'}`);
                console.log(`   Location: ${cls.location || 'N/A'}`);
                console.log(`   Capacity: ${capacity} | Available: ${available}`);
                console.log('');
            });
        }

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log('═'.repeat(100));
        console.log(`Users pending assignment: ${pendingUsers.recordset.length}`);
        console.log(`Available classes: ${classes.recordset.length}`);
        
        if (pendingUsers.recordset.length > 0 && classes.recordset.length > 0) {
            console.log('\n💡 NEXT STEPS:');
            console.log('1. Login to admin dashboard: http://localhost:3001/dashboard/dashboard.html');
            console.log('2. Navigate to "Class Management" section');
            console.log('3. Assign users to appropriate classes');
            console.log('4. Users will receive notifications about their class assignments');
        } else if (pendingUsers.recordset.length > 0) {
            console.log('\n⚠️  WARNING: Users are waiting but no classes available!');
            console.log('Please create classes first before assigning users.');
        } else if (classes.recordset.length > 0) {
            console.log('\n✅ All users have been assigned to classes!');
        }

        console.log('\n' + '═'.repeat(100));
        console.log('✅ Sync completed!');

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
syncUsers().then(() => process.exit(0));
