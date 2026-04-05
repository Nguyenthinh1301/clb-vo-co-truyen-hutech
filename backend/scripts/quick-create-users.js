/**
 * Quick Create Demo Users
 * Tạo nhanh các user demo để test
 */

const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generating password hashes...\n');
  
  const users = [
    { email: 'admin@hutech.edu.vn', password: 'admin123' },
    { email: 'member@hutech.edu.vn', password: 'member123' },
    { email: 'demo@test.com', password: '123456' }
  ];
  
  console.log('Copy and paste this SQL into SQL Server Management Studio:\n');
  console.log('USE clb_vo_co_truyen_hutech;');
  console.log('GO\n');
  console.log('-- Delete existing demo users');
  console.log("DELETE FROM users WHERE email IN ('admin@hutech.edu.vn', 'member@hutech.edu.vn', 'demo@test.com');");
  console.log('GO\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    const role = user.email.includes('admin') ? 'admin' : 'student';
    const name = user.email.includes('admin') ? 'Admin System' : 
                 user.email.includes('member') ? 'Thành Viên' : 'Demo User';
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ');
    const username = user.email.split('@')[0];
    
    console.log(`-- ${user.email} / ${user.password}`);
    console.log(`INSERT INTO users (email, username, password, first_name, last_name, full_name, role, membership_status, email_verified, is_active)`);
    console.log(`VALUES ('${user.email}', '${username}', '${hash}', '${firstName}', '${lastName}', '${name}', '${role}', 'active', 1, 1);`);
    console.log('GO\n');
  }
  
  console.log('-- Verify');
  console.log("SELECT id, email, username, full_name, role FROM users WHERE email IN ('admin@hutech.edu.vn', 'member@hutech.edu.vn', 'demo@test.com');");
  console.log('GO\n');
  
  console.log('✅ Copy the SQL above and run it in SSMS!\n');
}

generateHashes().catch(console.error);
