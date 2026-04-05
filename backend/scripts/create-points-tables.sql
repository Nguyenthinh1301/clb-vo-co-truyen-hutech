-- Script to create points system tables for MSSQL
-- Run this in SQL Server Management Studio or sqlcmd

USE clb_vo_co_truyen_hutech;
GO

-- Check if user_points table exists, if not create it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_points')
BEGIN
    PRINT 'Creating user_points table...';
    
    CREATE TABLE user_points (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        total_points INT DEFAULT 0,
        points_used INT DEFAULT 0,
        rank VARCHAR(20) DEFAULT 'bronze',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_user_points_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    PRINT 'user_points table created successfully';
END
ELSE
BEGIN
    PRINT 'user_points table already exists';
END
GO

-- Check if user_points_transactions table exists, if not create it
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_points_transactions')
BEGIN
    PRINT 'Creating user_points_transactions table...';
    
    CREATE TABLE user_points_transactions (
        id INT PRIMARY KEY IDENTITY(1,1),
        user_id INT NOT NULL,
        points INT NOT NULL,
        type VARCHAR(50),
        note NVARCHAR(500),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_transactions_creator FOREIGN KEY (created_by) REFERENCES users(id)
    );
    
    PRINT 'user_points_transactions table created successfully';
END
ELSE
BEGIN
    PRINT 'user_points_transactions table already exists';
END
GO

-- Create indexes for better performance
PRINT 'Creating indexes...';

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_points_user_id')
BEGIN
    CREATE INDEX idx_user_points_user_id ON user_points(user_id);
    PRINT 'Index on user_points.user_id created';
END
ELSE
BEGIN
    PRINT 'Index on user_points.user_id already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transactions_user_id')
BEGIN
    CREATE INDEX idx_transactions_user_id ON user_points_transactions(user_id);
    PRINT 'Index on user_points_transactions.user_id created';
END
ELSE
BEGIN
    PRINT 'Index on user_points_transactions.user_id already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transactions_created_at')
BEGIN
    CREATE INDEX idx_transactions_created_at ON user_points_transactions(created_at);
    PRINT 'Index on user_points_transactions.created_at created';
END
ELSE
BEGIN
    PRINT 'Index on user_points_transactions.created_at already exists';
END
GO

PRINT 'Points system tables setup completed successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '  - user_points table: Ready';
PRINT '  - user_points_transactions table: Ready';
PRINT '  - Indexes: Created';
PRINT '';
PRINT 'You can now use the admin points management system!';
GO
