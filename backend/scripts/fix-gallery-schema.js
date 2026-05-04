/**
 * Fix gallery schema trên PostgreSQL production
 * Thêm cột sort_order vào gallery_albums nếu chưa có
 * Chạy: node scripts/fix-gallery-schema.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixGallerySchema() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connecting to PostgreSQL...');

        // 1. Tạo bảng gallery_albums nếu chưa có (với sort_order)
        await client.query(`
            CREATE TABLE IF NOT EXISTS gallery_albums (
                id          SERIAL PRIMARY KEY,
                name        VARCHAR(255) NOT NULL,
                description TEXT,
                cover_image VARCHAR(500),
                sort_order  INT DEFAULT 0,
                status      VARCHAR(50) DEFAULT 'active',
                created_by  INT REFERENCES users(id) ON DELETE SET NULL,
                created_at  TIMESTAMP DEFAULT NOW(),
                updated_at  TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ gallery_albums table OK');

        // 2. Thêm cột sort_order nếu chưa có
        const colCheck = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'gallery_albums' AND column_name = 'sort_order'
        `);
        if (colCheck.rows.length === 0) {
            await client.query(`ALTER TABLE gallery_albums ADD COLUMN sort_order INT DEFAULT 0`);
            console.log('✅ Added sort_order column to gallery_albums');
        } else {
            console.log('ℹ️  sort_order column already exists');
        }

        // 3. Tạo bảng gallery_photos nếu chưa có
        await client.query(`
            CREATE TABLE IF NOT EXISTS gallery_photos (
                id          SERIAL PRIMARY KEY,
                album_id    INT NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
                image_url   VARCHAR(500) NOT NULL,
                caption     VARCHAR(500),
                sort_order  INT DEFAULT 0,
                created_at  TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ gallery_photos table OK');

        // 4. Tạo index nếu chưa có
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_gallery_photos_album ON gallery_photos(album_id)
        `);
        console.log('✅ Indexes OK');

        // 5. Test query
        const test = await client.query(`
            SELECT a.*, (SELECT COUNT(*) FROM gallery_photos p WHERE p.album_id = a.id) AS photo_count
            FROM gallery_albums a
            WHERE 1=1
            ORDER BY a.sort_order ASC, a.created_at DESC
        `);
        console.log(`✅ Test query OK — ${test.rows.length} albums found`);

        console.log('\n🎉 Gallery schema fixed successfully!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixGallerySchema();
