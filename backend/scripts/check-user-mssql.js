/**
 * Check user account in MSSQL database
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

async function checkUser(email) {
    let pool;
    try {
        console.log('🔍 Connecting to MSSQL database...\n');
        
        pool = await sql.connect(config);
        console.log('✅ Connected!\n');
        
        console.log('Checking user:', email);
        console.log('─'.repeat(60));

        // Get user info
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id, email, username, first_name, last_name, full_name, 
                       phone_number, role, membership_status, is_active, 
                       email_verified, created_at, last_login_at 
                FROM users 
                WHERE email = @email
            `);

        if (result.recordset.length === 0) {
            console.log('❌ User NOT found in database!\n');
            console.log('Possible reasons:');
            console.log('1. Email is incorrect');
            console.log('2. Registration failed');
            console.log('3. User was deleted\n');
            
            // Check all users to see what exists
            const allUsers = await pool.request().query('SELECT TOP 5 email, username, role FROM users ORDER BY created_at DESC');
            console.log('Recent users in database:');
            console.log('─'.repeat(60));
            allUsers.recordset.forEach((u, i) => {
                console.log(`${i + 1}. ${u.email} (${u.username}) - ${u.role}`);
            });
            
            return;
        }

        const user = result.recordset[0];
        console.log('\n✅ User FOUND!\n');
        console.log('User Information:');
        console.log('─'.repeat(60));
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Username:', user.username);
        console.log('Full Name:', user.full_name || `${user.first_name} ${user.last_name}`);
        console.log('Phone:', user.phone_number || 'N/A');
        console.log('Role:', user.role);
        console.log('Membership Status:', user.membership_status);
        console.log('Active:', user.is_active ? 'Yes' : 'No');
        console.log('Email Verified:', user.email_verified ? 'Yes' : 'No');
        console.log('Created At:', user.created_at);
        console.log('Last Login:', user.last_login_at || 'Never');

        // Check password hash
        const passwordResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT password_hash FROM users WHERE email = @email');

        console.log('\n🔐 Password Information:');
        console.log('─'.repeat(60));
        const passwordHash = passwordResult.recordset[0].password_hash;
        console.log('Password Hash:', passwordHash ? 'EXISTS' : 'MISSING');
        console.log('Hash Length:', passwordHash ? passwordHash.length : 0);
        console.log('Hash Preview:', passwordHash ? passwordHash.substring(0, 30) + '...' : 'N/A');
        console.log('Hash Type:', passwordHash && passwordHash.startsWith('$2') ? 'bcrypt' : 'unknown');

        // Check login attempts
        const attemptsResult = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT TOP 5 attempted_at, success, failure_reason, ip_address 
                FROM login_attempts 
                WHERE email = @email 
                ORDER BY attempted_at DESC
            `);

        console.log('\n📊 Recent Login Attempts:');
        console.log('─'.repeat(60));
        if (attemptsResult.recordset.length === 0) {
            console.log('No login attempts found');
        } else {
            attemptsResult.recordset.forEach((attempt, index) => {
                console.log(`\n${index + 1}. ${attempt.attempted_at}`);
                console.log('   Success:', attempt.success ? 'Yes' : 'No');
                console.log('   Reason:', attempt.failure_reason || 'N/A');
                console.log('   IP:', attempt.ip_address);
            });
        }

        // Check sessions
        const sessionsResult = await pool.request()
            .input('userId', sql.Int, user.id)
            .query(`
                SELECT TOP 3 id, created_at, expires_at, is_active 
                FROM user_sessions 
                WHERE user_id = @userId 
                ORDER BY created_at DESC
            `);

        console.log('\n🔑 Sessions:');
        console.log('─'.repeat(60));
        if (sessionsResult.recordset.length === 0) {
            console.log('No sessions found');
        } else {
            sessionsResult.recordset.forEach((session, index) => {
                console.log(`\n${index + 1}. Session ID: ${session.id}`);
                console.log('   Created:', session.created_at);
                console.log('   Expires:', session.expires_at);
                console.log('   Active:', session.is_active ? 'Yes' : 'No');
            });
        }

        console.log('\n' + '─'.repeat(60));
        console.log('✅ Check completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

// Get email from command line or use default
const email = process.argv[2] || 'an1@gmail.com';
checkUser(email).then(() => process.exit(0));
