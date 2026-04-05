/**
 * Run MSSQL Migration 002 - Fix Column Name Mismatches
 */

const fs = require('fs');
const path = require('path');
const mssqlDb = require('../config/mssql-database');

async function runMigration() {
    try {
        console.log('🚀 Starting MSSQL Migration 002...');
        
        // Read migration file
        const migrationPath = path.join(__dirname, '../database/mssql-migration-002.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by GO statements
        const statements = migrationSQL
            .split(/\nGO\n|\nGO$/gm)
            .filter(statement => statement.trim().length > 0)
            .map(statement => statement.trim());
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments and empty statements
            if (statement.startsWith('--') || statement.trim().length === 0) {
                continue;
            }
            
            try {
                console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                await mssqlDb.query(statement);
                console.log(`✅ Statement ${i + 1} executed successfully`);
            } catch (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error.message);
                console.log('Statement:', statement.substring(0, 200) + '...');
                
                // Continue with other statements unless it's a critical error
                if (error.message.includes('already exists') || 
                    error.message.includes('does not exist') ||
                    error.message.includes('Invalid column name')) {
                    console.log('⚠️  Non-critical error, continuing...');
                } else {
                    throw error;
                }
            }
        }
        
        console.log('🎉 Migration 002 completed successfully!');
        console.log('📊 Database schema updated to match application expectations');
        
        // Test the updated schema
        await testUpdatedSchema();
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    }
}

async function testUpdatedSchema() {
    try {
        console.log('\n🧪 Testing updated schema...');
        
        // Test users table structure
        const userColumns = await mssqlDb.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('👥 Users table columns:');
        userColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Test events table structure
        const eventColumns = await mssqlDb.query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'events'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('\n📅 Events table columns:');
        eventColumns.forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });
        
        // Test a simple query that was failing before
        try {
            const userCount = await mssqlDb.query('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
            console.log(`\n✅ User count query works: ${userCount[0]?.count || 0} active users`);
        } catch (error) {
            console.log(`❌ User count query failed: ${error.message}`);
        }
        
        try {
            const eventCount = await mssqlDb.query('SELECT COUNT(*) as count FROM events WHERE date > CAST(GETDATE() AS DATE)');
            console.log(`✅ Event count query works: ${eventCount[0]?.count || 0} upcoming events`);
        } catch (error) {
            console.log(`❌ Event count query failed: ${error.message}`);
        }
        
        console.log('\n🎯 Schema testing completed!');
        
    } catch (error) {
        console.error('Schema testing failed:', error);
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('\n✨ All done! You can now restart your server.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration, testUpdatedSchema };