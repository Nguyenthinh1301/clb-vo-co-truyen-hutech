/**
 * Check user account in database
 */

const db = require('../config/db');

async function checkUser(email) {
    try {
        console.log('🔍 Checking user account...\n');
        console.log('Email:', email);
        console.log('─'.repeat(60));

        // Get user info
        const user = await db.findOne(
            `SELECT id, email, username, first_name, last_name, full_name, 
             phone_number, role, membership_status, is_active, 
             email_verified, created_at, last_login_at 
             FROM users WHERE email = ?`,
            [email]
        );

        if (!user) {
            console.log('❌ User not found!');
            console.log('\nPossible reasons:');
            console.log('1. Email is incorrect');
            console.log('2. Registration failed');
            console.log('3. User was deleted');
            return;
        }

        console.log('\n✅ User found!\n');
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
        const passwordCheck = await db.findOne(
            'SELECT password_hash FROM users WHERE email = ?',
            [email]
        );

        console.log('\n🔐 Password Information:');
        console.log('─'.repeat(60));
        console.log('Password Hash:', passwordCheck.password_hash ? 'EXISTS' : 'MISSING');
        console.log('Hash Length:', passwordCheck.password_hash ? passwordCheck.password_hash.length : 0);
        console.log('Hash Preview:', passwordCheck.password_hash ? passwordCheck.password_hash.substring(0, 30) + '...' : 'N/A');

        // Check login attempts
        const loginAttempts = await db.query(
            `SELECT TOP 5 attempted_at, success, failure_reason, ip_address 
             FROM login_attempts 
             WHERE email = ? 
             ORDER BY attempted_at DESC`,
            [email]
        );

        console.log('\n📊 Recent Login Attempts:');
        console.log('─'.repeat(60));
        if (loginAttempts.length === 0) {
            console.log('No login attempts found');
        } else {
            loginAttempts.forEach((attempt, index) => {
                console.log(`\n${index + 1}. ${attempt.attempted_at}`);
                console.log('   Success:', attempt.success ? 'Yes' : 'No');
                console.log('   Reason:', attempt.failure_reason || 'N/A');
                console.log('   IP:', attempt.ip_address);
            });
        }

        // Check sessions
        const sessions = await db.query(
            `SELECT TOP 3 id, created_at, expires_at, is_active 
             FROM user_sessions 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [user.id]
        );

        console.log('\n🔑 Active Sessions:');
        console.log('─'.repeat(60));
        if (sessions.length === 0) {
            console.log('No sessions found');
        } else {
            sessions.forEach((session, index) => {
                console.log(`\n${index + 1}. Session ID: ${session.id}`);
                console.log('   Created:', session.created_at);
                console.log('   Expires:', session.expires_at);
                console.log('   Active:', session.is_active ? 'Yes' : 'No');
            });
        }

        console.log('\n' + '─'.repeat(60));
        console.log('✅ Check completed!');

    } catch (error) {
        console.error('❌ Error checking user:', error);
    } finally {
        process.exit(0);
    }
}

// Get email from command line or use default
const email = process.argv[2] || 'an1@gmail.com';
checkUser(email);
