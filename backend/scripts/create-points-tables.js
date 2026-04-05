/**
 * Script to create points system tables
 * Run: node backend/scripts/create-points-tables.js
 */

const db = require('../config/db');

async function createPointsTables() {
    try {
        console.log('🔄 Creating points system tables...\n');

        // Check if tables already exist
        const checkUserPoints = await db.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'user_points'
        `);

        const checkTransactions = await db.query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'user_points_transactions'
        `);

        // Create user_points table if not exists
        if (checkUserPoints[0].count === 0) {
            console.log('📋 Creating user_points table...');
            await db.query(`
                CREATE TABLE user_points (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    user_id INT NOT NULL,
                    total_points INT DEFAULT 0,
                    points_used INT DEFAULT 0,
                    rank VARCHAR(20) DEFAULT 'bronze',
                    created_at DATETIME DEFAULT GETDATE(),
                    updated_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
            console.log('✅ user_points table created successfully\n');
        } else {
            console.log('ℹ️  user_points table already exists\n');
        }

        // Create user_points_transactions table if not exists
        if (checkTransactions[0].count === 0) {
            console.log('📋 Creating user_points_transactions table...');
            await db.query(`
                CREATE TABLE user_points_transactions (
                    id INT PRIMARY KEY IDENTITY(1,1),
                    user_id INT NOT NULL,
                    points INT NOT NULL,
                    type VARCHAR(50),
                    note NVARCHAR(500),
                    created_by INT,
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users(id)
                )
            `);
            console.log('✅ user_points_transactions table created successfully\n');
        } else {
            console.log('ℹ️  user_points_transactions table already exists\n');
        }

        // Create indexes for better performance
        console.log('📋 Creating indexes...');
        
        try {
            await db.query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_points_user_id')
                CREATE INDEX idx_user_points_user_id ON user_points(user_id)
            `);
            console.log('✅ Index on user_points.user_id created');
        } catch (err) {
            console.log('ℹ️  Index on user_points.user_id already exists');
        }

        try {
            await db.query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transactions_user_id')
                CREATE INDEX idx_transactions_user_id ON user_points_transactions(user_id)
            `);
            console.log('✅ Index on user_points_transactions.user_id created');
        } catch (err) {
            console.log('ℹ️  Index on user_points_transactions.user_id already exists');
        }

        try {
            await db.query(`
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transactions_created_at')
                CREATE INDEX idx_transactions_created_at ON user_points_transactions(created_at)
            `);
            console.log('✅ Index on user_points_transactions.created_at created');
        } catch (err) {
            console.log('ℹ️  Index on user_points_transactions.created_at already exists');
        }

        console.log('\n✨ Points system tables setup completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   ✅ user_points table: Ready');
        console.log('   ✅ user_points_transactions table: Ready');
        console.log('   ✅ Indexes: Created');
        console.log('\n🎉 You can now use the admin points management system!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating points tables:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check database connection in backend/config/db.js');
        console.error('   2. Ensure users table exists');
        console.error('   3. Check database permissions');
        process.exit(1);
    }
}

// Run the script
createPointsTables();
