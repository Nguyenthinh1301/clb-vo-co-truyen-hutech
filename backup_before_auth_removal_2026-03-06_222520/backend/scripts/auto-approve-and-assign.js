/**
 * Auto Approve and Assign Users to Classes
 * Tự động phê duyệt và phân lớp cho tất cả sinh viên
 */

require('dotenv').config();
const sql = require('mssql');
const axios = require('axios');

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

const API_BASE_URL = 'http://localhost:3001/api';

async function autoApproveAndAssign() {
    let pool;
    let authToken;

    try {
        console.log('🚀 Starting auto approve and assign process...\n');
        
        // Step 1: Login as admin
        console.log('📝 Step 1: Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'Admin123456'
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful!\n');

        // Step 2: Connect to database
        console.log('📝 Step 2: Connecting to database...');
        pool = await sql.connect(config);
        console.log('✅ Connected to database!\n');

        // Step 3: Get pending users
        console.log('📝 Step 3: Getting pending users...');
        const pendingUsers = await pool.request().query(`
            SELECT id, email, first_name, last_name, full_name, phone_number
            FROM users
            WHERE role = 'student' AND membership_status = 'pending' AND is_active = 1
            ORDER BY created_at ASC
        `);

        const users = pendingUsers.recordset;
        console.log(`✅ Found ${users.length} pending users\n`);

        if (users.length === 0) {
            console.log('ℹ️  No pending users to process');
            return;
        }

        // Step 4: Get available classes
        console.log('📝 Step 4: Getting available classes...');
        const classesResult = await pool.request().query(`
            SELECT id, name, schedule, location, max_students, current_students
            FROM classes
            WHERE status = 'active'
            ORDER BY id
        `);

        const classes = classesResult.recordset;
        console.log(`✅ Found ${classes.length} available classes\n`);

        if (classes.length === 0) {
            console.log('⚠️  No classes available!');
            return;
        }

        console.log('═'.repeat(80));
        console.log('PROCESSING USERS');
        console.log('═'.repeat(80));
        console.log('');

        let successCount = 0;
        let failCount = 0;

        // Step 5: Process each user
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const userName = user.full_name || `${user.first_name} ${user.last_name}`;
            
            console.log(`\n[${i + 1}/${users.length}] Processing: ${userName} (${user.email})`);
            console.log('─'.repeat(80));

            try {
                // 5.1: Approve user
                console.log('  📋 Approving user...');
                const approveResponse = await axios.post(
                    `${API_BASE_URL}/admin/users/${user.id}/approve`,
                    {},
                    {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    }
                );

                if (approveResponse.data.success) {
                    console.log('  ✅ User approved');
                } else {
                    console.log('  ⚠️  Approval response:', approveResponse.data.message);
                }

                // 5.2: Assign to class (distribute evenly)
                const classIndex = i % classes.length;
                const selectedClass = classes[classIndex];

                console.log(`  📚 Assigning to class: ${selectedClass.name}`);
                const assignResponse = await axios.post(
                    `${API_BASE_URL}/admin/class-management/assign`,
                    {
                        userId: user.id,
                        classId: selectedClass.id
                    },
                    {
                        headers: { 
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (assignResponse.data.success) {
                    console.log('  ✅ Class assigned');
                    console.log(`  📍 Class: ${selectedClass.name}`);
                    console.log(`  📅 Schedule: ${selectedClass.schedule || 'N/A'}`);
                    console.log(`  📌 Location: ${selectedClass.location || 'N/A'}`);
                    successCount++;
                } else {
                    console.log('  ⚠️  Assignment response:', assignResponse.data.message);
                    failCount++;
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.log('  ❌ Error:', error.response?.data?.message || error.message);
                failCount++;
            }
        }

        // Step 6: Summary
        console.log('\n');
        console.log('═'.repeat(80));
        console.log('SUMMARY');
        console.log('═'.repeat(80));
        console.log(`Total users processed: ${users.length}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log('');

        // Step 7: Show final statistics
        console.log('📊 Final Statistics:');
        console.log('─'.repeat(80));

        const finalStats = await pool.request().query(`
            SELECT 
                COUNT(*) as total_students,
                SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_students,
                SUM(CASE WHEN membership_status = 'pending' THEN 1 ELSE 0 END) as pending_students
            FROM users
            WHERE role = 'student'
        `);

        const stats = finalStats.recordset[0];
        console.log(`Total Students: ${stats.total_students}`);
        console.log(`Active Students: ${stats.active_students}`);
        console.log(`Pending Students: ${stats.pending_students}`);
        console.log('');

        // Show class enrollments
        const enrollmentStats = await pool.request().query(`
            SELECT 
                c.name,
                c.current_students,
                c.max_students,
                COUNT(ce.id) as enrolled_count
            FROM classes c
            LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.status = 'active'
            WHERE c.status = 'active'
            GROUP BY c.id, c.name, c.current_students, c.max_students
        `);

        console.log('📚 Class Enrollments:');
        console.log('─'.repeat(80));
        enrollmentStats.recordset.forEach(cls => {
            console.log(`${cls.name}: ${cls.current_students}/${cls.max_students || '∞'} students`);
        });

        console.log('\n');
        console.log('═'.repeat(80));
        console.log('✅ AUTO APPROVE AND ASSIGN COMPLETED!');
        console.log('═'.repeat(80));
        console.log('');
        console.log('💡 Next Steps:');
        console.log('1. Check admin dashboard: http://localhost:3001/dashboard/admin-user-management.html');
        console.log('2. Verify notifications were sent to users');
        console.log('3. Users can now login and see their assigned classes');
        console.log('');

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Run
autoApproveAndAssign().then(() => process.exit(0));
