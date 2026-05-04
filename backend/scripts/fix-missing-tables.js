/**
 * Fix Missing Tables — Tạo các bảng còn thiếu trong MSSQL
 * Chạy: node scripts/fix-missing-tables.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function fixMissingTables() {
    console.log('🔧 Kiểm tra và tạo các bảng còn thiếu...\n');

    const dbType = process.env.DB_TYPE || 'mysql';
    console.log(`📊 Database type: ${dbType}\n`);

    // ── 1. login_attempts ──────────────────────────────────────
    try {
        const exists = await db.findOne(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'login_attempts'`
        );
        if (!exists || exists.cnt === 0) {
            console.log('📋 Tạo bảng login_attempts...');
            if (dbType === 'mssql') {
                await db.query(`
                    CREATE TABLE login_attempts (
                        id           INT IDENTITY(1,1) PRIMARY KEY,
                        email        NVARCHAR(255) NOT NULL,
                        ip_address   NVARCHAR(45),
                        user_agent   NVARCHAR(MAX),
                        success      BIT DEFAULT 0,
                        failure_reason NVARCHAR(100),
                        attempted_at DATETIME DEFAULT GETDATE()
                    )
                `);
                try { await db.query(`CREATE INDEX idx_la_email ON login_attempts(email)`); } catch(e) {}
                try { await db.query(`CREATE INDEX idx_la_attempted ON login_attempts(attempted_at)`); } catch(e) {}
            } else {
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
            console.log('✅ Tạo login_attempts thành công!\n');
        } else {
            console.log('ℹ️  login_attempts đã tồn tại\n');
        }
    } catch (err) {
        console.error('❌ Lỗi tạo login_attempts:', err.message, '\n');
    }

    // ── 2. user_points_transactions ────────────────────────────
    try {
        const exists = await db.findOne(
            `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_points_transactions'`
        );
        if (!exists || exists.cnt === 0) {
            // Kiểm tra xem có bảng points_transactions không (alias)
            const ptExists = await db.findOne(
                `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'points_transactions'`
            );
            if (ptExists && ptExists.cnt > 0) {
                console.log('📋 Tạo view user_points_transactions (alias cho points_transactions)...');
                try {
                    await db.query(`CREATE VIEW user_points_transactions AS SELECT * FROM points_transactions`);
                    console.log('✅ Tạo view user_points_transactions thành công!\n');
                } catch(e) {
                    console.log('ℹ️  View đã tồn tại hoặc lỗi:', e.message, '\n');
                }
            } else {
                console.log('📋 Tạo bảng user_points_transactions...');
                if (dbType === 'mssql') {
                    await db.query(`
                        CREATE TABLE user_points_transactions (
                            id          INT IDENTITY(1,1) PRIMARY KEY,
                            user_id     INT NOT NULL,
                            points      INT NOT NULL,
                            type        NVARCHAR(50) DEFAULT 'earn',
                            category    NVARCHAR(100),
                            description NVARCHAR(500),
                            created_at  DATETIME DEFAULT GETDATE()
                        )
                    `);
                    try { await db.query(`CREATE INDEX idx_upt_user ON user_points_transactions(user_id)`); } catch(e) {}
                    try { await db.query(`CREATE INDEX idx_upt_date ON user_points_transactions(created_at)`); } catch(e) {}
                } else {
                    await db.query(`
                        CREATE TABLE IF NOT EXISTS user_points_transactions (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id INT NOT NULL,
                            points INT NOT NULL,
                            type VARCHAR(50) DEFAULT 'earn',
                            category VARCHAR(100),
                            description VARCHAR(500),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            INDEX idx_user_id (user_id),
                            INDEX idx_created_at (created_at)
                        )
                    `);
                }
                console.log('✅ Tạo user_points_transactions thành công!\n');
            }
        } else {
            console.log('ℹ️  user_points_transactions đã tồn tại\n');
        }
    } catch (err) {
        console.error('❌ Lỗi tạo user_points_transactions:', err.message, '\n');
    }

    // ── 3. Kiểm tra user_sessions có cột token không ──────────
    if (dbType === 'mssql') {
        try {
            const tokenCol = await db.findOne(
                `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_NAME = 'user_sessions' AND COLUMN_NAME = 'token'`
            );
            if (!tokenCol || tokenCol.cnt === 0) {
                console.log('📋 Thêm cột token vào user_sessions...');
                await db.query(`ALTER TABLE user_sessions ADD token NVARCHAR(500) NULL`);
                try {
                    await db.query(`CREATE UNIQUE INDEX idx_us_token ON user_sessions(token) WHERE token IS NOT NULL`);
                } catch(e) {}
                console.log('✅ Thêm cột token thành công!\n');
            } else {
                console.log('ℹ️  user_sessions.token đã tồn tại\n');
            }

            const rtCol = await db.findOne(
                `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_NAME = 'user_sessions' AND COLUMN_NAME = 'refresh_token'`
            );
            if (!rtCol || rtCol.cnt === 0) {
                console.log('📋 Thêm cột refresh_token vào user_sessions...');
                await db.query(`ALTER TABLE user_sessions ADD refresh_token NVARCHAR(500) NULL`);
                console.log('✅ Thêm cột refresh_token thành công!\n');
            } else {
                console.log('ℹ️  user_sessions.refresh_token đã tồn tại\n');
            }
        } catch (err) {
            console.error('❌ Lỗi kiểm tra user_sessions:', err.message, '\n');
        }
    }

    console.log('🎉 Hoàn thành! Khởi động lại backend để áp dụng thay đổi.');
    process.exit(0);
}

fixMissingTables().catch(err => {
    console.error('❌ Lỗi không xử lý được:', err);
    process.exit(1);
});
