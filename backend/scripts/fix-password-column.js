/**
 * Fix cột password trong bảng users
 * Rename password_hash -> password để khớp với schema MSSQL
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sql = require('mssql');

const config = {
    server:   process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    user:     process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
    connectionTimeout: 30000,
    requestTimeout: 30000
};

async function fix() {
    try {
        const pool = await sql.connect(config);
        console.log('✅ Kết nối thành công\n');

        // Kiểm tra cột hiện tại
        const check = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
              AND COLUMN_NAME IN ('password', 'password_hash')
        `);
        const cols = check.recordset.map(r => r.COLUMN_NAME);
        console.log('Cột hiện tại:', cols);

        const hasPwdHash = cols.includes('password_hash');
        const hasPwd     = cols.includes('password');

        if (hasPwdHash && !hasPwd) {
            await pool.request().query(`EXEC sp_rename 'users.password_hash', 'password', 'COLUMN'`);
            console.log('✅ Đã rename password_hash → password');
        } else if (hasPwd && !hasPwdHash) {
            console.log('✅ Cột password đã đúng, không cần sửa');
        } else if (hasPwd && hasPwdHash) {
            console.log('⚠️  Cả hai cột đều tồn tại! Kiểm tra thủ công.');
        } else {
            console.log('❌ Không tìm thấy cột password hoặc password_hash!');
        }

        // Kiểm tra lại
        const verify = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' 
              AND COLUMN_NAME IN ('password', 'password_hash')
        `);
        console.log('\nKết quả sau fix:');
        verify.recordset.forEach(r => console.log(`  ✓ ${r.COLUMN_NAME} (${r.DATA_TYPE})`));

        await sql.close();
        console.log('\n✅ Xong!');
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    }
}

fix();
