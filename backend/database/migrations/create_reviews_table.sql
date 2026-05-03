-- Migration: Tạo bảng reviews (Cảm nhận sinh viên)
-- Chạy: sqlcmd -S localhost -d clb_vo_co_truyen_hutech -i create_reviews_table.sql

USE clb_vo_co_truyen_hutech;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reviews')
BEGIN
    CREATE TABLE reviews (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        author_name NVARCHAR(255)  NOT NULL,
        faculty     NVARCHAR(255)  NULL,
        year        INT            NULL,
        rating      INT            DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
        content     NVARCHAR(MAX)  NOT NULL,
        avatar_url  NVARCHAR(500)  NULL,
        status      NVARCHAR(50)   DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_by  INT            NULL,
        created_at  DATETIME       DEFAULT GETDATE(),
        updated_at  DATETIME       DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX idx_reviews_status ON reviews(status);
    CREATE INDEX idx_reviews_rating ON reviews(rating);
    CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

    PRINT 'Bảng reviews đã được tạo thành công.';
END
ELSE
BEGIN
    PRINT 'Bảng reviews đã tồn tại, bỏ qua.';
END
GO
