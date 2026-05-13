require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    const client = await pool.connect();
    try {
        // 1. Kiểm tra cột
        const cols = await client.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'activities' ORDER BY ordinal_position"
        );
        console.log('Activities columns:');
        cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

        // 2. Test INSERT với updated_at
        console.log('\nTest INSERT with updated_at...');
        const ins = await client.query(
            `INSERT INTO activities (title, type, year, status, updated_at)
             VALUES ('Test', 'achievement', 2026, 'active', NOW()) RETURNING id`
        );
        console.log('INSERT OK: id=' + ins.rows[0].id);

        // 3. Cleanup
        await client.query("DELETE FROM activities WHERE id = $1", [ins.rows[0].id]);
        console.log('Cleanup OK');

        // 4. Kiểm tra constraint type
        console.log('\nTest INSERT với type không hợp lệ...');
        try {
            await client.query(
                "INSERT INTO activities (title, type, year, status) VALUES ('Test2', 'invalid_type', 2026, 'active')"
            );
            console.log('WARNING: Constraint không hoạt động!');
        } catch(e) {
            console.log('Constraint OK: ' + e.message.split('\n')[0]);
        }

    } catch(e) {
        console.error('ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
check();
