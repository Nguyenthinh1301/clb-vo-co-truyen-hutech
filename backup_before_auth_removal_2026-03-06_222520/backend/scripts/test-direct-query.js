/**
 * Test Direct SQL Query
 */

require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
    user: process.env.MSSQL_USER || 'clb_admin',
    password: process.env.MSSQL_PASSWORD || 'CLB@Hutech2026!',
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function testQuery() {
    console.log('🔍 Testing direct MSSQL query...\n');
    console.log('Config:', {
        server: config.server,
        database: config.database,
        user: config.user
    });
    console.log('');
    
    try {
        // Connect
        await sql.connect(config);
        console.log('✅ Connected to MSSQL\n');
        
        // Get columns
        console.log('📋 Getting table structure...');
        const columnsResult = await sql.query`
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `;
        
        console.log('\n✅ Columns in users table:');
        columnsResult.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Check password column
        const passwordCol = columnsResult.recordset.find(col => 
            col.COLUMN_NAME.toLowerCase().includes('password')
        );
        
        if (passwordCol) {
            console.log(`\n✅ Password column: ${passwordCol.COLUMN_NAME}`);
        } else {
            console.log('\n❌ No password column found!');
        }
        
        // Get users
        console.log('\n👥 Getting users...');
        const usersResult = await sql.query`
            SELECT id, email, username, role, is_active
            FROM users
        `;
        
        console.log(`\n✅ Found ${usersResult.recordset.length} users:`);
        usersResult.recordset.forEach(user => {
            console.log(`  - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });
        
        await sql.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testQuery();
