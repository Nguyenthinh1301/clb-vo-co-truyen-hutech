/**
 * Create Test Users
 * Tạo users test với password_hash column
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

async function createTestUsers() {
    console.log('🌱 Creating test users...\n');
    
    try {
        await sql.connect(config);
        console.log('✅ Connected to MSSQL\n');
        
        const testUsers = [
            {
                email: 'admin@test.com',
                username: 'admin_test',
                password: 'admin123',
                full_name: 'Admin Test',
                first_name: 'Admin',
                last_name: 'Test',
                role: 'admin',
                is_active: 1
            },
            {
                email: 'user@test.com',
                username: 'user_test',
                password: 'user123',
                full_name: 'User Test',
                first_name: 'User',
                last_name: 'Test',
                role: 'student',
                is_active: 1
            }
        ];
        
        for (const user of testUsers) {
            // Check if exists
            const checkResult = await sql.query`
                SELECT id, email FROM users WHERE email = ${user.email}
            `;
            
            if (checkResult.recordset.length > 0) {
                console.log(`⚠️  User ${user.email} already exists (ID: ${checkResult.recordset[0].id})`);
                
                // Update password
                const passwordHash = await bcrypt.hash(user.password, 10);
                await sql.query`
                    UPDATE users 
                    SET password_hash = ${passwordHash},
                        username = ${user.username},
                        is_active = 1
                    WHERE email = ${user.email}
                `;
                console.log(`   ✅ Updated password for ${user.email}\n`);
                continue;
            }
            
            // Create new user
            const passwordHash = await bcrypt.hash(user.password, 10);
            
            const result = await sql.query`
                INSERT INTO users (
                    email, username, password_hash, full_name, 
                    first_name, last_name, role, is_active,
                    email_verified, created_at
                )
                VALUES (
                    ${user.email}, ${user.username}, ${passwordHash}, ${user.full_name},
                    ${user.first_name}, ${user.last_name}, ${user.role}, ${user.is_active},
                    1, GETDATE()
                )
            `;
            
            console.log(`✅ Created user: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.role}\n`);
        }
        
        console.log('✅ Test users created successfully!\n');
        console.log('📝 Login credentials:');
        console.log('   Admin: admin@test.com / admin123');
        console.log('   User: user@test.com / user123\n');
        
        await sql.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createTestUsers();
