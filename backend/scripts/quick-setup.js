const bcrypt = require('bcryptjs');
const sql = require('mssql');

(async () => {
  try {
    console.log('🚀 Quick Setup - Creating Admin User...\n');
    
    // Hash password
    const hash = await bcrypt.hash('admin123456', 10);
    
    // Connect to SQL Server
    const pool = await sql.connect({
      server: 'localhost\\SQLEXPRESS',
      database: 'clb_vo_co_truyen_hutech',
      options: {
        trustServerCertificate: true,
        trustedConnection: true,
        encrypt: false
      }
    });
    
    console.log('✅ Connected to SQL Server\n');
    
    // Delete existing admin
    await pool.request().query(`DELETE FROM users WHERE email='admin@vocotruyenhutech.edu.vn'`);
    
    // Create admin user
    await pool.request()
      .input('email', sql.NVarChar, 'admin@vocotruyenhutech.edu.vn')
      .input('password', sql.NVarChar, hash)
      .input('full_name', sql.NVarChar, 'Administrator')
      .input('phone', sql.NVarChar, '0123456789')
      .input('role', sql.NVarChar, 'admin')
      .query('INSERT INTO users (email,password,full_name,phone,role,email_verified) VALUES (@email,@password,@full_name,@phone,@role,1)');
    
    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email: admin@vocotruyenhutech.edu.vn');
    console.log('🔑 Password: admin123456\n');
    
    // Create sample instructor
    const instructorHash = await bcrypt.hash('instructor123', 10);
    await pool.request()
      .input('email', sql.NVarChar, 'instructor@vocotruyenhutech.edu.vn')
      .input('password', sql.NVarChar, instructorHash)
      .input('full_name', sql.NVarChar, 'Huấn Luyện Viên')
      .input('phone', sql.NVarChar, '0987654321')
      .input('role', sql.NVarChar, 'instructor')
      .query('INSERT INTO users (email,password,full_name,phone,role,email_verified) VALUES (@email,@password,@full_name,@phone,@role,1)');
    
    console.log('✅ Instructor user created!');
    console.log('📧 Email: instructor@vocotruyenhutech.edu.vn');
    console.log('🔑 Password: instructor123\n');
    
    // Verify
    const result = await pool.request().query('SELECT id, email, full_name, role FROM users');
    console.log('📊 Total users:', result.recordset.length);
    result.recordset.forEach(user => {
      console.log(`   - ${user.full_name} (${user.email}) - ${user.role}`);
    });
    
    await pool.close();
    console.log('\n🎉 Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
