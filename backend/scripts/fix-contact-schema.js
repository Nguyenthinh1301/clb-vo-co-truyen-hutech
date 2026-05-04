/**
 * Fix contact & notifications schema trên PostgreSQL production
 * Chạy: node scripts/fix-contact-schema.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addColumnIfMissing(client, table, column, definition) {
    const r = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = $1 AND column_name = $2`,
        [table, column]
    );
    if (r.rows.length === 0) {
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`  ✅ Added ${table}.${column}`);
    } else {
        console.log(`  ℹ️  ${table}.${column} already exists`);
    }
}

async function fix() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to PostgreSQL\n');

        // ── 1. Fix notifications table ──────────────────────
        console.log('📋 Fixing notifications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id          SERIAL PRIMARY KEY,
                user_id     INT REFERENCES users(id) ON DELETE CASCADE,
                title       VARCHAR(255) NOT NULL,
                message     TEXT NOT NULL,
                type        VARCHAR(50)  DEFAULT 'info',
                priority    VARCHAR(50)  DEFAULT 'normal',
                action_url  VARCHAR(500),
                is_read     BOOLEAN      DEFAULT FALSE,
                expires_at  TIMESTAMP,
                created_at  TIMESTAMP    DEFAULT NOW()
            )
        `);
        await addColumnIfMissing(client, 'notifications', 'priority',   "VARCHAR(50) DEFAULT 'normal'");
        await addColumnIfMissing(client, 'notifications', 'action_url', 'VARCHAR(500)');
        await addColumnIfMissing(client, 'notifications', 'expires_at', 'TIMESTAMP');

        // Fix type constraint — pg-schema cũ chỉ cho 'info','success','warning','error'
        // notifications route dùng type='system' → cần drop constraint cũ
        try {
            await client.query(`
                ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check
            `);
            console.log('  ✅ Dropped old type constraint');
        } catch(e) { /* ignore */ }

        // ── 2. Fix contact_messages table ───────────────────
        console.log('\n📋 Fixing contact_messages table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id              SERIAL PRIMARY KEY,
                name            VARCHAR(255) NOT NULL,
                email           VARCHAR(255) NOT NULL,
                phone           VARCHAR(20),
                subject         VARCHAR(255),
                message         TEXT NOT NULL,
                status          VARCHAR(50)  DEFAULT 'new',
                replied_by      INT REFERENCES users(id) ON DELETE SET NULL,
                replied_at      TIMESTAMP,
                reply_message   TEXT,
                ip_address      VARCHAR(50),
                user_agent      VARCHAR(500),
                created_at      TIMESTAMP DEFAULT NOW(),
                updated_at      TIMESTAMP DEFAULT NOW()
            )
        `);
        await addColumnIfMissing(client, 'contact_messages', 'replied_by',    'INT REFERENCES users(id) ON DELETE SET NULL');
        await addColumnIfMissing(client, 'contact_messages', 'replied_at',    'TIMESTAMP');
        await addColumnIfMissing(client, 'contact_messages', 'reply_message', 'TEXT');
        await addColumnIfMissing(client, 'contact_messages', 'updated_at',    'TIMESTAMP DEFAULT NOW()');

        // ── 3. Test insert ───────────────────────────────────
        console.log('\n🧪 Testing contact insert...');
        const testId = await client.query(`
            INSERT INTO contact_messages (name, email, phone, subject, message, status, ip_address)
            VALUES ('Test', 'test@test.com', '0901234567', 'Test', 'Test message', 'new', '127.0.0.1')
            RETURNING id
        `);
        console.log(`  ✅ Insert OK — id=${testId.rows[0].id}`);

        // Cleanup test
        await client.query(`DELETE FROM contact_messages WHERE email = 'test@test.com'`);
        console.log('  ✅ Cleanup OK');

        // ── 4. Test notification insert ──────────────────────
        console.log('\n🧪 Testing notification insert...');
        const notifId = await client.query(`
            INSERT INTO notifications (user_id, title, message, type, priority, action_url)
            VALUES (NULL, 'Test', 'Test notification', 'system', 'medium', '/test')
            RETURNING id
        `);
        console.log(`  ✅ Insert OK — id=${notifId.rows[0].id}`);
        await client.query(`DELETE FROM notifications WHERE title = 'Test' AND action_url = '/test'`);
        console.log('  ✅ Cleanup OK');

        console.log('\n🎉 Contact schema fixed successfully!');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
