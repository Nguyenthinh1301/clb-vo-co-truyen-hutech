/**
 * Seed Demo Users Script
 * Tạo các tài khoản demo để test đăng nhập
 */

require('dotenv').config();
const db = require('../config/db');
const { AuthUtils } = require('../middleware/auth');

async function seedDemoUsers() {
  console.log('🌱 Seeding demo users...\n');
  
  try {
    // Test database connection
    const connectionTest = await db.testConnection();
    if (!connectionTest || !connectionTest.success) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✅ Database connected\n');
    
    // Demo users to create
    const demoUsers = [
      {
        email: 'admin@hutech.edu.vn',
        username: 'admin',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'System',
        full_name: 'Admin System',
        phone_number: '0123456789',
        role: 'admin',
        membership_status: 'active',
        email_verified: 1,
        is_active: 1
      },
      {
        email: 'member@hutech.edu.vn',
        username: 'member',
        password: 'member123',
        first_name: 'Thành',
        last_name: 'Viên',
        full_name: 'Thành Viên',
        phone_number: '0987654321',
        role: 'student',
        membership_status: 'active',
        email_verified: 1,
        is_active: 1
      },
      {
        email: 'demo@test.com',
        username: 'demo',
        password: '123456',
        first_name: 'Demo',
        last_name: 'User',
        full_name: 'Demo User',
        phone_number: '0999888777',
        role: 'student',
        membership_status: 'active',
        email_verified: 1,
        is_active: 1
      }
    ];
    
    console.log('Creating demo users...\n');
    
    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const existing = await db.findOne(
          'SELECT id, email FROM users WHERE email = ?',
          [user.email]
        );
        
        if (existing) {
          console.log(`⚠️  User ${user.email} already exists (ID: ${existing.id})`);
          
          // Update password for existing user
          const passwordHash = await AuthUtils.hashPassword(user.password);
          await db.update(
            'users',
            { 
              password: passwordHash,
              username: user.username,
              is_active: 1
            },
            'id = ?',
            [existing.id]
          );
          console.log(`   ✅ Updated password for ${user.email}\n`);
          continue;
        }
        
        // Hash password
        const passwordHash = await AuthUtils.hashPassword(user.password);
        
        // Create user
        const userId = await db.insert('users', {
          email: user.email,
          username: user.username,
          password: passwordHash,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role: user.role,
          membership_status: user.membership_status,
          email_verified: user.email_verified,
          is_active: user.is_active
        });
        
        console.log(`✅ Created user: ${user.email}`);
        console.log(`   ID: ${userId}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Role: ${user.role}\n`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n✅ Demo users seeded successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Admin: admin@hutech.edu.vn / admin123');
    console.log('   Member: member@hutech.edu.vn / member123');
    console.log('   Demo: demo@test.com / 123456\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

// Run seed
seedDemoUsers();
