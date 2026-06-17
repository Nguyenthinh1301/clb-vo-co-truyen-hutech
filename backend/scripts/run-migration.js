#!/usr/bin/env node
/**
 * Run database migrations
 * Usage: node backend/scripts/run-migration.js <migration-file>
 * Example: node backend/scripts/run-migration.js 001_increase_varchar_limits.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration(migrationFile) {
    console.log('\n🔄 Running migration:', migrationFile);
    console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'unknown');
    console.log('---');

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../database/migrations', migrationFile);
        
        if (!fs.existsSync(migrationPath)) {
            throw new Error(`Migration file not found: ${migrationPath}`);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Migration SQL:');
        console.log(sql);
        console.log('---');

        // Execute migration
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Split by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--'));
            
            for (const statement of statements) {
                if (statement) {
                    console.log('\nExecuting:', statement.substring(0, 80) + '...');
                    await client.query(statement);
                    console.log('✅ Success');
                }
            }
            
            await client.query('COMMIT');
            console.log('\n✅ Migration completed successfully!');
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Main
const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('Usage: node run-migration.js <migration-file>');
    console.error('Example: node run-migration.js 001_increase_varchar_limits.sql');
    process.exit(1);
}

runMigration(migrationFile);
