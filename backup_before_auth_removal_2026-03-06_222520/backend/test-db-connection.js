/**
 * Simple test to check database connection
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    console.log('Server:', config.server);
    console.log('Database:', config.database);
    console.log('User:', config.user);
    
    const pool = await sql.connect(config);
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('\n📊 SQL Server Version:');
    console.log(result.recordset[0].version);
    
    // Check if tables exist
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📋 Tables in database:');
    tables.recordset.forEach(table => {
      console.log('  -', table.TABLE_NAME);
    });
    
    await pool.close();
    console.log('\n✨ Connection test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check if SQL Server is running');
    console.error('2. Verify server name:', config.server);
    console.error('3. Check database exists:', config.database);
    console.error('4. Verify credentials');
    console.error('5. Check firewall settings');
    process.exit(1);
  }
}

testConnection();
