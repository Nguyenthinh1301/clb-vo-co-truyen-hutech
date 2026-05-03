-- ============================================================
-- Migration 003: Full Schema Sync
-- Đồng bộ toàn bộ schema với code hiện tại
-- Chạy file này trên SQL Server Management Studio
-- ============================================================

USE clb_vo_co_truyen_hutech;
GO

PRINT '=== Migration 003: Full Schema Sync ===';
GO

-- ============================================================
-- 1. FIX BẢNG users
-- ============================================================

-- 1a. Nếu migration-001 đã rename password → password_hash, rename lại thành password
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password_hash')
   AND NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password')
BEGIN
    EXEC sp_rename 'users.password_hash', 'password', 'COLUMN';
    PRINT '✓ Renamed password_hash → password';
END
GO

-- 1b. Thêm cột profile_image nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'profile_image')
BEGIN
    ALTER TABLE users ADD profile_image NVARCHAR(500) NULL;
    PRINT '✓ Added users.profile_image';
END
GO

-- 1c. Thêm cột join_date nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'join_date')
BEGIN
    ALTER TABLE users ADD join_date DATE NULL DEFAULT CAST(GETDATE() AS DATE);
    PRINT '✓ Added users.join_date';
END
GO

-- 1d. Thêm cột emergency_contact nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'emergency_contact')
BEGIN
    ALTER TABLE users ADD emergency_contact NVARCHAR(500) NULL;
    PRINT '✓ Added users.emergency_contact';
END
GO

-- 1e. Thêm cột medical_info nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'medical_info')
BEGIN
    ALTER TABLE users ADD medical_info NVARCHAR(MAX) NULL;
    PRINT '✓ Added users.medical_info';
END
GO

-- 1f. Thêm cột full_name nếu chưa có
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'full_name')
BEGIN
    ALTER TABLE users ADD full_name NVARCHAR(255) NULL;
    PRINT '✓ Added users.full_name';
END
GO

-- 1g. Cập nhật full_name từ first_name + last_name
UPDATE users
SET full_name = LTRIM(RTRIM(ISNULL(first_name,'') + ' ' + ISNULL(last_name,'')))
WHERE full_name IS NULL OR full_name = '';
GO

-- ============================================================
-- 2. FIX BẢNG user_sessions
--    Code dùng cột 'token' và 'refresh_token' (không phải token_hash)
-- ============================================================

-- Nếu bảng user_sessions dùng token_hash, thêm cột token để tương thích
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
BEGIN
    -- Thêm cột token nếu chưa có (code dùng cột này)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('user_sessions') AND name = 'token')
    BEGIN
        ALTER TABLE user_sessions ADD token NVARCHAR(500) NULL;
        PRINT '✓ Added user_sessions.token';
    END

    -- Thêm cột refresh_token nếu chưa có
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('user_sessions') AND name = 'refresh_token')
    BEGIN
        ALTER TABLE user_sessions ADD refresh_token NVARCHAR(500) NULL;
        PRINT '✓ Added user_sessions.refresh_token';
    END

    -- Tạo unique index cho token nếu chưa có
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_sessions_token_col' AND object_id = OBJECT_ID('user_sessions'))
    BEGIN
        CREATE UNIQUE INDEX idx_user_sessions_token_col ON user_sessions(token) WHERE token IS NOT NULL;
        PRINT '✓ Created index on user_sessions.token';
    END
END
ELSE
BEGIN
    -- Tạo mới bảng user_sessions với đầy đủ cột
    CREATE TABLE user_sessions (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        user_id         INT NOT NULL,
        token           NVARCHAR(500) NOT NULL UNIQUE,
        refresh_token   NVARCHAR(500) NULL UNIQUE,
        device_info     NVARCHAR(MAX) NULL,
        ip_address      NVARCHAR(50) NULL,
        user_agent      NVARCHAR(500) NULL,
        is_active       BIT DEFAULT 1,
        expires_at      DATETIME NOT NULL,
        created_at      DATETIME DEFAULT GETDATE(),
        updated_at      DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_active  ON user_sessions(is_active);
    PRINT '✓ Created user_sessions table';
END
GO

-- ============================================================
-- 3. TẠO BẢNG login_attempts (nếu chưa có)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE login_attempts (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        email          NVARCHAR(255) NULL,
        ip_address     NVARCHAR(50) NOT NULL,
        user_agent     NVARCHAR(500) NULL,
        success        BIT DEFAULT 0,
        failure_reason NVARCHAR(255) NULL,
        attempted_at   DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX idx_login_attempts_ip    ON login_attempts(ip_address);
    CREATE INDEX idx_login_attempts_date  ON login_attempts(attempted_at);
    PRINT '✓ Created login_attempts table';
END
GO

-- ============================================================
-- 4. TẠO BẢNG audit_logs (nếu chưa có)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        user_id     INT NULL,
        action      NVARCHAR(100) NOT NULL,
        table_name  NVARCHAR(100) NULL,
        record_id   INT NULL,
        old_values  NVARCHAR(MAX) NULL,
        new_values  NVARCHAR(MAX) NULL,
        ip_address  NVARCHAR(50) NULL,
        user_agent  NVARCHAR(500) NULL,
        created_at  DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_audit_logs_user   ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX idx_audit_logs_date   ON audit_logs(created_at);
    PRINT '✓ Created audit_logs table';
END
GO

-- ============================================================
-- 5. TẠO BẢNG reviews (Cảm nhận sinh viên)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reviews')
BEGIN
    CREATE TABLE reviews (
        id          INT IDENTITY(1,1) PRIMARY KEY,
        author_name NVARCHAR(255) NOT NULL,
        faculty     NVARCHAR(255) NULL,
        year        NVARCHAR(20) NULL,
        rating      INT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
        content     NVARCHAR(MAX) NOT NULL,
        status      NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
        avatar_url  NVARCHAR(500) NULL,
        created_by  INT NULL,
        created_at  DATETIME DEFAULT GETDATE(),
        updated_at  DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_reviews_status ON reviews(status);
    CREATE INDEX idx_reviews_rating ON reviews(rating);
    PRINT '✓ Created reviews table';
END
GO

-- ============================================================
-- 6. TẠO BẢNG payments (nếu chưa có)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payments')
BEGIN
    CREATE TABLE payments (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        user_id        INT NOT NULL,
        amount         DECIMAL(18,2) NOT NULL,
        currency       NVARCHAR(10) DEFAULT 'VND',
        status         NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        method         NVARCHAR(50) NULL,
        reference_type NVARCHAR(50) NULL,
        reference_id   INT NULL,
        transaction_id NVARCHAR(255) NULL,
        notes          NVARCHAR(MAX) NULL,
        created_at     DATETIME DEFAULT GETDATE(),
        updated_at     DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_payments_user   ON payments(user_id);
    CREATE INDEX idx_payments_status ON payments(status);
    CREATE INDEX idx_payments_date   ON payments(created_at);
    PRINT '✓ Created payments table';
END
GO

-- ============================================================
-- 7. FIX BẢNG notifications — thêm cột còn thiếu
-- ============================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'priority')
    BEGIN
        ALTER TABLE notifications ADD priority NVARCHAR(50) DEFAULT 'medium';
        PRINT '✓ Added notifications.priority';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'created_by')
    BEGIN
        ALTER TABLE notifications ADD created_by INT NULL;
        PRINT '✓ Added notifications.created_by';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'expires_at')
    BEGIN
        ALTER TABLE notifications ADD expires_at DATETIME NULL;
        PRINT '✓ Added notifications.expires_at';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'read_at')
    BEGIN
        ALTER TABLE notifications ADD read_at DATETIME NULL;
        PRINT '✓ Added notifications.read_at';
    END
END
GO

-- ============================================================
-- 8. FIX BẢNG classes — thêm cột còn thiếu
-- ============================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'classes')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('classes') AND name = 'level')
    BEGIN
        ALTER TABLE classes ADD level NVARCHAR(50) NULL;
        PRINT '✓ Added classes.level';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('classes') AND name = 'fee')
    BEGIN
        ALTER TABLE classes ADD fee DECIMAL(18,2) NULL DEFAULT 0;
        PRINT '✓ Added classes.fee';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('classes') AND name = 'image')
    BEGIN
        ALTER TABLE classes ADD image NVARCHAR(500) NULL;
        PRINT '✓ Added classes.image';
    END
END
GO

-- ============================================================
-- 9. FIX BẢNG class_enrollments — thêm cột còn thiếu
-- ============================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'class_enrollments')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('class_enrollments') AND name = 'enrollment_date')
    BEGIN
        ALTER TABLE class_enrollments ADD enrollment_date DATETIME DEFAULT GETDATE();
        PRINT '✓ Added class_enrollments.enrollment_date';
    END

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('class_enrollments') AND name = 'payment_status')
    BEGIN
        ALTER TABLE class_enrollments ADD payment_status NVARCHAR(50) DEFAULT 'pending';
        PRINT '✓ Added class_enrollments.payment_status';
    END
END
GO

-- ============================================================
-- 10. FIX BẢNG attendance — thêm cột recorded_by
-- ============================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('attendance') AND name = 'recorded_by')
    BEGIN
        ALTER TABLE attendance ADD recorded_by INT NULL;
        PRINT '✓ Added attendance.recorded_by';
    END
END
GO

-- ============================================================
-- 11. TẠO BẢNG user_points_transactions (alias cho points_transactions)
--     Code dùng tên 'user_points_transactions' trong một số chỗ
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_points_transactions')
   AND EXISTS (SELECT * FROM sys.tables WHERE name = 'points_transactions')
BEGIN
    -- Tạo view alias để tương thích
    EXEC('CREATE VIEW user_points_transactions AS SELECT * FROM points_transactions');
    PRINT '✓ Created user_points_transactions view (alias for points_transactions)';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_points_transactions')
   AND NOT EXISTS (SELECT * FROM sys.views WHERE name = 'user_points_transactions')
   AND NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_transactions')
BEGIN
    CREATE TABLE user_points_transactions (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        user_id        INT NOT NULL,
        points         INT NOT NULL,
        type           NVARCHAR(50) NOT NULL,
        category       NVARCHAR(50) NULL,
        description    NVARCHAR(500) NULL,
        reference_id   INT NULL,
        reference_type NVARCHAR(50) NULL,
        created_by     INT NULL,
        created_at     DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_upt_user ON user_points_transactions(user_id);
    CREATE INDEX idx_upt_date ON user_points_transactions(created_at);
    PRINT '✓ Created user_points_transactions table';
END
GO

-- ============================================================
-- 12. KIỂM TRA KẾT QUẢ
-- ============================================================
PRINT '';
PRINT '=== Danh sách bảng hiện có ===';
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

PRINT '';
PRINT '=== Cột bảng users ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '=== Cột bảng user_sessions ===';
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'user_sessions'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '✅ Migration 003 hoàn thành!';
GO
