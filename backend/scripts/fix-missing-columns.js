/**
 * Thêm các cột còn thiếu trong bảng users
 * Usage: node scripts/fix-missing-columns.js
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

const columns = [
    { name: 'notes',             sql: 'NVARCHAR(MAX) NULL' },
    { name: 'profile_image',     sql: 'NVARCHAR(500) NULL' },
    { name: 'join_date',         sql: 'DATE NULL' },
    { name: 'emergency_contact', sql: 'NVARCHAR(500) NULL' },
    { name: 'medical_info',      sql: 'NVARCHAR(MAX) NULL' },
    { name: 'full_name',         sql: 'NVARCHAR(255) NULL' },
    { name: 'two_factor_enabled',sql: 'BIT DEFAULT 0' },
    { name: 'email_verified',    sql: 'BIT DEFAULT 0' },
];

async function fix() {
    try {
        const pool = await sql.connect(config);
        console.log('✅ Kết nối thành công\n');

        for (const col of columns) {
            const check = await pool.request().query(`
                SELECT COUNT(*) as cnt
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = 'users' AND COLUMN_NAME = '${col.name}'
            `);
            if (check.recordset[0].cnt === 0) {
                await pool.request().query(`ALTER TABLE users ADD ${col.name} ${col.sql}`);
                console.log(`✅ Thêm cột users.${col.name}`);
            } else {
                console.log(`  - users.${col.name} đã tồn tại`);
            }
        }

        // Cập nhật full_name từ first_name + last_name
        await pool.request().query(`
            UPDATE users
            SET full_name = LTRIM(RTRIM(ISNULL(first_name,'') + ' ' + ISNULL(last_name,'')))
            WHERE full_name IS NULL OR full_name = ''
        `);
        console.log('✅ Cập nhật full_name');

        // Kiểm tra cột password
        const pwdCheck = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('password', 'password_hash')
        `);
        console.log('\n🔍 Cột password:', pwdCheck.recordset.map(r => r.COLUMN_NAME));

        // Nếu vẫn là password_hash, rename lại
        const hasPwdHash = pwdCheck.recordset.some(r => r.COLUMN_NAME === 'password_hash');
        const hasPwd     = pwdCheck.recordset.some(r => r.COLUMN_NAME === 'password');
        if (hasPwdHash && !hasPwd) {
            await pool.request().query(`EXEC sp_rename 'users.password_hash', 'password', 'COLUMN'`);
            console.log('✅ Renamed password_hash → password');
        }

        console.log('\n✅ Hoàn thành!');
        await sql.close();
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    }
}

fix();
