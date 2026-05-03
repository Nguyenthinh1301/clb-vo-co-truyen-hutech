-- ══════════════════════════════════════════════════════════════
-- Migration: Tạo bảng Thư viện ảnh (Gallery)
-- Chạy: node scripts/run-gallery-migration.js
-- ══════════════════════════════════════════════════════════════

-- Bảng album ảnh
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_albums')
BEGIN
    CREATE TABLE gallery_albums (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        name        NVARCHAR(255) NOT NULL,
        description NVARCHAR(500),
        cover_image NVARCHAR(500),
        sort_order  INT DEFAULT 0,
        status      NVARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive')),
        created_by  INT FOREIGN KEY REFERENCES users(id) ON DELETE SET NULL,
        created_at  DATETIME DEFAULT GETDATE(),
        updated_at  DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_gallery_albums_status ON gallery_albums(status);
    CREATE INDEX idx_gallery_albums_sort   ON gallery_albums(sort_order);
    PRINT 'Created table: gallery_albums';
END
GO

-- Bảng ảnh trong album
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'gallery_photos')
BEGIN
    CREATE TABLE gallery_photos (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        album_id   INT NOT NULL FOREIGN KEY REFERENCES gallery_albums(id) ON DELETE CASCADE,
        image_url  NVARCHAR(500) NOT NULL,
        caption    NVARCHAR(255),
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_gallery_photos_album ON gallery_photos(album_id);
    CREATE INDEX idx_gallery_photos_sort  ON gallery_photos(sort_order);
    PRINT 'Created table: gallery_photos';
END
GO
