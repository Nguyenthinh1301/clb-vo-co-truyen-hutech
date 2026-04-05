/**
 * Check MySQL Connection Script
 * Kiểm tra kết nối MySQL và hướng dẫn khởi động
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMySQL() {
  console.log('🔍 Checking MySQL Connection...\n');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(empty)'}\n`);

  try {
    console.log('Attempting to connect...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ MySQL Connection Successful!\n');

    // Check if database exists
    const dbName = process.env.DB_NAME || 'clb_vo_co_truyen_hutech';
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [dbName]);
    
    if (databases.length > 0) {
      console.log(`✅ Database '${dbName}' exists`);
      
      // Check tables
      await connection.query(`USE ${dbName}`);
      const [tables] = await connection.query('SHOW TABLES');
      
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    } else {
      console.log(`❌ Database '${dbName}' does not exist`);
      console.log(`\n📝 To create database, run: npm run init-db`);
    }

    await connection.end();
    
  } catch (error) {
    console.log('❌ MySQL Connection Failed!\n');
    console.log(`Error: ${error.message}\n`);

    console.log('💡 Troubleshooting Steps:\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('MySQL server is not running. Please start it:');
      console.log('\n📌 Option 1: WAMP');
      console.log('   - Open WAMP Control Panel');
      console.log('   - Click "Start All Services"');
      console.log('   - Wait for green icon\n');
      
      console.log('📌 Option 2: Docker');
      console.log('   cd backend');
      console.log('   docker-compose up -d mysql\n');
      
      console.log('📌 Option 3: Command Line (as Administrator)');
      console.log('   Start-Service wampmysqld64\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Access denied. Check your credentials in .env file:');
      console.log('   DB_USER=root');
      console.log('   DB_PASSWORD=your_password\n');
    } else {
      console.log('Unknown error. Check MySQL installation and configuration.\n');
    }
    
    process.exit(1);
  }
}

checkMySQL();
