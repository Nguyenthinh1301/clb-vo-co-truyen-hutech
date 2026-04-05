require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
    user: process.env.MSSQL_USER || 'clb_admin',
    password: process.env.MSSQL_PASSWORD || 'CLB@Hutech2026!',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkSchema() {
    let pool;
    try {
        pool = await sql.connect(config);
        
        const result = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'notifications'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Notifications table columns:');
        console.log('─'.repeat(60));
        result.recordset.forEach(r => {
            console.log(`${r.COLUMN_NAME.padEnd(30)} ${r.DATA_TYPE.padEnd(15)} ${r.IS_NULLABLE}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (pool) await pool.close();
    }
}

checkSchema().then(() => process.exit(0));
