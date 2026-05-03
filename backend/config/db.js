/**
 * Universal Database Interface
 * Tự động chọn MySQL, MSSQL hoặc PostgreSQL dựa trên DB_TYPE
 */

require('dotenv').config();

const dbType = process.env.DB_TYPE || 'mysql';

let db;

if (dbType === 'postgres' || dbType === 'postgresql') {
  db = require('./pg-database');
  console.log('📊 Using database: PostgreSQL');
} else if (dbType === 'mssql') {
  // Use MSSQL with MySQL-compatible adapter
  db = require('./mssql-adapter');
  console.log('📊 Using database: MSSQL (with MySQL adapter)');
} else {
  // Use MySQL (default)
  db = require('./database');
  console.log('📊 Using database: MySQL');
}

module.exports = db;
