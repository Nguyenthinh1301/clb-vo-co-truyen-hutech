/**
 * Create Admin User Script
 * Tạo tài khoản admin với password đã hash
 */

const bcrypt = require('bcryptjs');

async function createAdmin() {
  console.log('🔐 Creating Admin User...\n');
  
  const email = 'admin@vocotruyenhutech.edu.vn';
  const password = 'admin123456';
  
  console.log('Generating password hash...');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('\n✅ Admin credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`\n📋 Password Hash (copy this):`);
  console.log(`   ${hashedPassword}`);
  
  console.log('\n📝 SQL Query to run in SSMS:');
  console.log(`
USE clb_vo_co_truyen_hutech;

-- Delete existing admin if any
DELETE FROM users WHERE email = '${email}';

-- Create new admin user
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    '${email}',
    '${hashedPassword}',
    'Administrator',
    '0123456789',
    'admin',
    1
);

-- Verify
SELECT id, email, full_name, role FROM users WHERE email = '${email}';
  `);
  
  console.log('\n💡 Instructions:');
  console.log('   1. Copy the SQL query above');
  console.log('   2. Open SQL Server Management Studio');
  console.log('   3. Connect to localhost\\SQLEXPRESS');
  console.log('   4. Paste and execute the query');
  console.log('   5. Verify admin user is created\n');
}

createAdmin();
