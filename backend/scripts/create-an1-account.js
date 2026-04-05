/**
 * Create account for an1@gmail.com
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function createAccount() {
    try {
        console.log('🔧 Creating account for an1@gmail.com...\n');

        // Check if user already exists
        const existing = await db.findOne('SELECT id, email FROM users WHERE email = ?', ['an1@gmail.com']);
        
        if (existing) {
            console.log('⚠️  User already exists!');
            console.log('Email:', existing.email);
            console.log('ID:', existing.id);
            console.log('\nDeleting old account...');
            await db.delete('users', 'id = ?', [existing.id]);
            console.log('✅ Old account deleted');
        }

        // Hash password
        console.log('\n🔐 Hashing password...');
        const passwordHash = await bcrypt.hash('An12345678', 10);
        console.log('✅ Password hashed');

        // Create user
        console.log('\n👤 Creating user...');
        const userId = await db.insert('users', {
            email: 'an1@gmail.com',
            username: 'an1',
            password_hash: passwordHash,
            first_name: 'An',
            last_name: 'Nguyen',
            full_name: 'An Nguyen',
            phone_number: null,
            date_of_birth: null,
            gender: null,
            address: null,
            role: 'student',
            membership_status: 'active',
            is_active: 1,
            email_verified: 0
        });

        console.log('✅ User created with ID:', userId);

        // Get created user
        const user = await db.findOne(
            'SELECT id, email, username, first_name, last_name, full_name, role, membership_status, is_active, created_at FROM users WHERE id = ?',
            [userId]
        );

        console.log('\n📋 Account Information:');
        console.log('─'.repeat(60));
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Username:', user.username);
        console.log('Full Name:', user.full_name);
        console.log('Role:', user.role);
        console.log('Membership:', user.membership_status);
        console.log('Active:', user.is_active ? 'Yes' : 'No');
        console.log('Created:', user.created_at);

        console.log('\n🔑 Login Credentials:');
        console.log('─'.repeat(60));
        console.log('Email: an1@gmail.com');
        console.log('Password: An12345678');

        console.log('\n✅ Account created successfully!');
        console.log('\nYou can now login at:');
        console.log('- website/views/account/dang-nhap.html');
        console.log('- Or test with: node test-login-an1.js');

    } catch (error) {
        console.error('\n❌ Error creating account:', error.message);
        console.error(error);
    } finally {
        process.exit(0);
    }
}

createAccount();
