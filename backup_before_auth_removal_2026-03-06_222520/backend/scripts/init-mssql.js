/**
 * Initialize Microsoft SQL Server Database
 * Tạo database, tables và insert seed data
 */

const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// SQL Server configuration  
const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  options: {
    database: 'master',
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true,
    instanceName: 'SQLEXPRESS'
  }
};

async function initDatabase() {
  console.log('🚀 Initializing SQL Server Database...\n');
  
  let pool;
  
  try {
    // Connect to SQL Server
    console.log('📡 Connecting to SQL Server...');
    console.log(`   Server: ${config.server}`);
    console.log(`   Authentication: Windows Authentication\n`);
    
    pool = await sql.connect(config);
    console.log('✅ Connected to SQL Server\n');
    
    // Read and execute schema
    console.log('📄 Reading schema file...');
    const schemaPath = path.join(__dirname, '../database/mssql-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔨 Creating database and tables...');
    
    // Split by GO statements
    const statements = schema.split(/\bGO\b/gi);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        await pool.request().query(trimmed);
      }
    }
    
    console.log('✅ Database and tables created\n');
    
    // Insert seed data
    console.log('🌱 Inserting seed data...');
    
    // Use the new database
    await pool.request().query('USE clb_vo_co_truyen_hutech');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456', 10);
    
    await pool.request()
      .input('email', sql.NVarChar, 'admin@vocotruyenhutech.edu.vn')
      .input('password', sql.NVarChar, adminPassword)
      .input('full_name', sql.NVarChar, 'Administrator')
      .input('phone', sql.NVarChar, '0123456789')
      .input('role', sql.NVarChar, 'admin')
      .query(`
        IF NOT EXISTS (SELECT * FROM users WHERE email = @email)
        BEGIN
          INSERT INTO users (email, password, full_name, phone, role, email_verified)
          VALUES (@email, @password, @full_name, @phone, @role, 1)
        END
      `);
    
    console.log('✅ Admin user created');
    console.log('   Email: admin@vocotruyenhutech.edu.vn');
    console.log('   Password: admin123456\n');
    
    // Create sample instructor
    const instructorPassword = await bcrypt.hash('instructor123', 10);
    
    await pool.request()
      .input('email', sql.NVarChar, 'instructor@vocotruyenhutech.edu.vn')
      .input('password', sql.NVarChar, instructorPassword)
      .input('full_name', sql.NVarChar, 'Huấn Luyện Viên')
      .input('phone', sql.NVarChar, '0987654321')
      .input('role', sql.NVarChar, 'instructor')
      .query(`
        IF NOT EXISTS (SELECT * FROM users WHERE email = @email)
        BEGIN
          INSERT INTO users (email, password, full_name, phone, role, email_verified)
          VALUES (@email, @password, @full_name, @phone, @role, 1)
        END
      `);
    
    console.log('✅ Instructor user created');
    console.log('   Email: instructor@vocotruyenhutech.edu.vn');
    console.log('   Password: instructor123\n');
    
    // Create sample class
    const instructorResult = await pool.request()
      .input('email', sql.NVarChar, 'instructor@vocotruyenhutech.edu.vn')
      .query('SELECT id FROM users WHERE email = @email');
    
    if (instructorResult.recordset.length > 0) {
      const instructorId = instructorResult.recordset[0].id;
      
      await pool.request()
        .input('name', sql.NVarChar, 'Lớp Võ Cơ Bản')
        .input('description', sql.NVarChar, 'Lớp học võ cổ truyền dành cho người mới bắt đầu')
        .input('instructor_id', sql.Int, instructorId)
        .input('schedule', sql.NVarChar, 'Thứ 2, 4, 6 - 18:00-20:00')
        .input('location', sql.NVarChar, 'Sân tập HUTECH')
        .input('max_students', sql.Int, 30)
        .query(`
          IF NOT EXISTS (SELECT * FROM classes WHERE name = @name)
          BEGIN
            INSERT INTO classes (name, description, instructor_id, schedule, location, max_students, start_date)
            VALUES (@name, @description, @instructor_id, @schedule, @location, @max_students, GETDATE())
          END
        `);
      
      console.log('✅ Sample class created\n');
    }
    
    // Create sample event
    await pool.request()
      .input('name', sql.NVarChar, 'Giải Võ Sinh Viên 2026')
      .input('description', sql.NVarChar, 'Giải thi đấu võ cổ truyền dành cho sinh viên')
      .input('type', sql.NVarChar, 'tournament')
      .input('location', sql.NVarChar, 'Nhà thi đấu HUTECH')
      .input('max_participants', sql.Int, 100)
      .query(`
        IF NOT EXISTS (SELECT * FROM events WHERE name = @name)
        BEGIN
          INSERT INTO events (name, description, type, location, date, start_time, end_time, max_participants)
          VALUES (@name, @description, @type, @location, DATEADD(day, 30, GETDATE()), '08:00', '17:00', @max_participants)
        END
      `);
    
    console.log('✅ Sample event created\n');
    
    console.log('🎉 Database initialization completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✅ Database created');
    console.log('   ✅ 12 tables created');
    console.log('   ✅ Admin user created');
    console.log('   ✅ Sample data inserted\n');
    console.log('🚀 You can now start the backend server with: npm run dev\n');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure SQL Server is running');
    console.error('   2. Check your credentials in .env file');
    console.error('   3. Verify SQL Server allows SQL authentication');
    console.error('   4. Check firewall settings\n');
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initDatabase();
