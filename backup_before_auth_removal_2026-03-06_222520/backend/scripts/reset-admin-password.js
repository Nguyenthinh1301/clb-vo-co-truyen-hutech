/**
 * Reset admin password
 */

require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
    server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
    user: process.env.MSSQL_USER || 'clb_admin',
    password: process.env.MSSQL_PASSWORD || 'CLB@Hutech2026!',
    options: {
        encrypt: process.env.MSSQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function resetAdminPassword() {
    let pool;
    try {
        console.log('🔐 Resetting admin password...\n');
        
        pool = await sql.connect(config);
        console.log('✅ Connected to database!\n');

        const email = 'admin@test.com';
        const newPassword = 'Admin123456';

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        console.log('🔒 New password hashed\n');

        // Update password
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query(`
                UPDATE users 
                SET password_hash = @passwordHash,
                    updated_at = GETDATE()
                WHERE email = @email
            `);

        console.log('✅ Password updated successfully!\n');
        console.log('═'.repeat(60));
        console.log('Admin Login Credentials:');
        console.log('═'.repeat(60));
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log('═'.repeat(60));
        console.log('\nYou can now login with these credentials.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

resetAdminPassword().then(() => process.exit(0));
