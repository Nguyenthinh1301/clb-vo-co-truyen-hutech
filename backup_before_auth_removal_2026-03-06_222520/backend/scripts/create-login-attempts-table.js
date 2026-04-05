/**
 * Create login_attempts table if not exists
 * Tạo bảng login_attempts nếu chưa có
 */

const db = require('../config/db');

async function createLoginAttemptsTable() {
    try {
        console.log('🔧 Creating login_attempts table...');

        const dbType = process.env.DB_TYPE || 'mysql';

        if (dbType === 'mssql') {
            // MSSQL syntax - Check if table exists first
            const tableExists = await db.query(`
                SELECT COUNT(*) as count 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = 'login_attempts'
            `);
            
            if (tableExists[0].count === 0) {
                await db.query(`
                    CREATE TABLE login_attempts (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        email VARCHAR(255) NOT NULL,
                        ip_address VARCHAR(45),
                        user_agent VARCHAR(MAX),
                        success BIT DEFAULT 0,
                        failure_reason VARCHAR(100),
                        attempted_at DATETIME DEFAULT GETDATE()
                    )
                `);
                
                // Create indexes separately
                await db.query(`CREATE INDEX idx_email ON login_attempts(email)`);
                await db.query(`CREATE INDEX idx_attempted_at ON login_attempts(attempted_at)`);
            } else {
                console.log('ℹ️  Table login_attempts already exists');
            }
        } else {
            // MySQL syntax
            await db.query(`
                CREATE TABLE IF NOT EXISTS login_attempts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    success BOOLEAN DEFAULT FALSE,
                    failure_reason VARCHAR(100),
                    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_attempted_at (attempted_at)
                )
            `);
        }

        console.log('✅ login_attempts table created successfully!');
        
        // Test insert
        console.log('🧪 Testing insert...');
        const testId = await db.insert('login_attempts', {
            email: 'test@example.com',
            ip_address: '127.0.0.1',
            user_agent: 'Test Agent',
            success: false,
            failure_reason: 'test'
        });
        
        console.log('✅ Test insert successful! ID:', testId);
        
        // Clean up test data
        await db.query('DELETE FROM login_attempts WHERE email = ?', ['test@example.com']);
        console.log('✅ Test data cleaned up');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating login_attempts table:', error);
        process.exit(1);
    }
}

createLoginAttemptsTable();
