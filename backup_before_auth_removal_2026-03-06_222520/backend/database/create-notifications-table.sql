-- Create Notifications Table for MSSQL
-- Run this script in SQL Server Management Studio

USE clb_vo_co_truyen_hutech;
GO

-- Check if table exists, if not create it
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        type NVARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'class', 'event', 'system', 'urgent')),
        priority NVARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        is_read BIT DEFAULT 0,
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    
    -- Create indexes for better performance
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);
    CREATE INDEX idx_notifications_created_by ON notifications(created_by);
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
    
    PRINT '✅ Table notifications created successfully';
END
ELSE
BEGIN
    PRINT '⚠️ Table notifications already exists';
END
GO

-- Verify table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'notifications'
ORDER BY ORDINAL_POSITION;
GO

PRINT '';
PRINT '📊 Notifications table structure:';
PRINT '   - id: Primary key';
PRINT '   - user_id: Người nhận (FK to users)';
PRINT '   - type: Loại thông báo';
PRINT '   - priority: Mức độ ưu tiên';
PRINT '   - title: Tiêu đề';
PRINT '   - message: Nội dung';
PRINT '   - is_read: Đã đọc (0/1)';
PRINT '   - created_by: Người gửi (FK to users)';
PRINT '   - created_at: Thời gian tạo';
PRINT '';
PRINT '✅ Ready to use!';
GO
