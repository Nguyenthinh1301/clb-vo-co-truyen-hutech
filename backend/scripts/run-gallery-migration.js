/**
 * Chạy migration tạo bảng gallery_albums và gallery_photos
 * Usage: node scripts/run-gallery-migration.js
 */
require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const db   = require('../config/db');

async function run() {
    console.log('🖼️  Chạy Gallery Migration...');
    try {
        // Tạo gallery_albums
        await db.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_albums')
            BEGIN
                CREATE TABLE gallery_albums (
                    id          INT IDENTITY(1,1) PRIMARY KEY,
                    name        NVARCHAR(255) NOT NULL,
                    description NVARCHAR(500),
                    cover_image NVARCHAR(500),
                    sort_order  INT DEFAULT 0,
                    status      NVARCHAR(20) DEFAULT 'active',
                    created_by  INT,
                    created_at  DATETIME DEFAULT GETDATE(),
                    updated_at  DATETIME DEFAULT GETDATE()
                )
            END
        `);
        console.log('✅ gallery_albums OK');

        // Tạo gallery_photos
        await db.query(`
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_photos')
            BEGIN
                CREATE TABLE gallery_photos (
                    id         INT IDENTITY(1,1) PRIMARY KEY,
                    album_id   INT NOT NULL,
                    image_url  NVARCHAR(500) NOT NULL,
                    caption    NVARCHAR(255),
                    sort_order INT DEFAULT 0,
                    created_at DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
                )
            END
        `);
        console.log('✅ gallery_photos OK');

        // Thêm indexes
        await db.query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gallery_albums_status')
                CREATE INDEX idx_gallery_albums_status ON gallery_albums(status)
        `);
        await db.query(`
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_gallery_photos_album')
                CREATE INDEX idx_gallery_photos_album ON gallery_photos(album_id)
        `);
        console.log('✅ Indexes OK');
        console.log('\n🎉 Gallery migration hoàn thành!');
    } catch (err) {
        console.error('❌ Migration lỗi:', err.message);
        process.exit(1);
    }
    process.exit(0);
}

run();
