/**
 * Chạy Migration 003 - Full Schema Sync
 * Usage: node scripts/run-migration-003.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const sql  = require('mssql');

// Thử SQL Auth trước, nếu fail thì thử Windows Auth
const configs = [
    // Config 1: SQL Auth từ .env
    {
        label: 'SQL Auth (clb_admin)',
        server:   process.env.MSSQL_SERVER   || 'localhost\\SQLEXPRESS',
        database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
        user:     process.env.MSSQL_USER,
        password: process.env.MSSQL_PASSWORD,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        connectionTimeout: 30000,
        requestTimeout:    60000
    },
    // Config 2: Windows Auth (trusted connection)
    {
        label: 'Windows Auth (trusted)',
        server:   process.env.MSSQL_SERVER   || 'localhost\\SQLEXPRESS',
        database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true,
            trustedConnection: true
        },
        connectionTimeout: 30000,
        requestTimeout:    60000
    }
];

async function tryConnect() {
    for (const cfg of configs) {
        try {
            console.log(`  Thử ${cfg.label}...`);
            const pool = await sql.connect(cfg);
            console.log(`  ✅ Kết nối thành công với ${cfg.label}\n`);
            return pool;
        } catch (err) {
            console.log(`  ❌ ${cfg.label}: ${err.message.split('\n')[0]}`);
            await sql.close().catch(() => {});
        }
    }
    return null;
}

async function runMigration() {
    let pool;
    try {
        console.log('🔌 Kết nối SQL Server...');
        pool = await tryConnect();

        if (!pool) {
            console.error('\n❌ Không thể kết nối SQL Server với bất kỳ cấu hình nào.');
            console.log('\n📋 Hướng dẫn chạy thủ công qua SSMS:');
            console.log('   1. Mở SQL Server Management Studio');
            console.log('   2. Kết nối vào:', process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS');
            console.log('   3. Mở file: backend/database/mssql-migration-003.sql');
            console.log('   4. Nhấn F5 để chạy');
            process.exit(1);
        }

        // Đọc file SQL
        const sqlFile = path.join(__dirname, '../database/mssql-migration-003.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Tách theo GO
        const statements = sqlContent
            .split(/^\s*GO\s*$/im)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📋 Tìm thấy ${statements.length} statements\n`);

        let success = 0, skipped = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (!stmt || stmt.startsWith('--')) continue;

            try {
                const request = pool.request();
                await request.query(stmt);
                success++;
            } catch (err) {
                const ignorable = [2714, 1913, 2705, 4902]; // already exists errors
                if (ignorable.includes(err.number) ||
                    err.message.includes('already exists') ||
                    err.message.includes('duplicate')) {
                    skipped++;
                } else {
                    console.warn(`  ⚠️  [${i+1}] ${err.message.split('\n')[0]}`);
                    skipped++;
                }
            }
        }

        console.log(`\n✅ Hoàn thành! ${success} thành công, ${skipped} bỏ qua\n`);

        // Kiểm tra kết quả
        console.log('📊 Bảng hiện có:');
        const tables = await pool.request().query(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME`
        );
        tables.recordset.forEach(t => console.log('  ✓', t.TABLE_NAME));

        console.log('\n🔍 Cột password trong users:');
        const cols = await pool.request().query(
            `SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_NAME='users' AND COLUMN_NAME IN ('password','password_hash')`
        );
        if (cols.recordset.length === 0) {
            console.log('  ⚠️  Không tìm thấy cột password!');
        } else {
            cols.recordset.forEach(c => console.log(`  ✓ ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
        }

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    } finally {
        await sql.close().catch(() => {});
        console.log('\n🔌 Đã đóng kết nối.');
    }
}

runMigration();
