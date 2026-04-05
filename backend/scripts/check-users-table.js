/**
 * Check Users Table Structure
 */

require('dotenv').config();
const db = require('../config/db');

async function checkUsersTable() {
  console.log('🔍 Checking users table structure...\n');
  
  try {
    // Test connection
    const connectionTest = await db.testConnection();
    if (!connectionTest || !connectionTest.success) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    console.log('✅ Database connected\n');
    
    // Get sample user to see columns
    console.log('📋 Checking users table...\n');
    
    const sampleUsers = await db.query(`
      SELECT TOP 1 * FROM users
    `);
    
    if (sampleUsers && sampleUsers.length > 0) {
      console.log('✅ Users table exists');
      console.log('\n📋 Columns in users table:');
      const columns = Object.keys(sampleUsers[0]);
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Check for password column
      const passwordCol = columns.find(col => 
        col.toLowerCase().includes('password')
      );
      
      if (passwordCol) {
        console.log(`\n✅ Password column found: ${passwordCol}`);
      } else {
        console.log('\n❌ No password column found!');
      }
      
      // Get all users
      console.log('\n👥 Users in database:');
      const allUsers = await db.query(`
        SELECT id, email, username, role, is_active, created_at
        FROM users
        ORDER BY id
      `);
      
      allUsers.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Active: ${user.is_active}`);
      });
      
    } else {
      console.log('❌ Users table is empty or does not exist');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();
