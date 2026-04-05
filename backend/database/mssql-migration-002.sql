-- MSSQL Migration 002: Fix Column Name Mismatches
-- Date: 2025-01-18
-- Purpose: Update existing tables to match application expectations

USE clb_vo_co_truyen_hutech;
GO

-- Update users table structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'username')
        ALTER TABLE users ADD username NVARCHAR(255);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'first_name')
        ALTER TABLE users ADD first_name NVARCHAR(255);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_name')
        ALTER TABLE users ADD last_name NVARCHAR(255);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
        ALTER TABLE users ADD phone_number NVARCHAR(20);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'date_of_birth')
        ALTER TABLE users ADD date_of_birth DATE;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'gender')
        ALTER TABLE users ADD gender NVARCHAR(10) CHECK (gender IN ('male', 'female', 'other'));
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'address')
        ALTER TABLE users ADD address NVARCHAR(500);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'membership_status')
        ALTER TABLE users ADD membership_status NVARCHAR(50) DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'pending'));
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_active')
        ALTER TABLE users ADD is_active BIT DEFAULT 1;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'belt_level')
        ALTER TABLE users ADD belt_level NVARCHAR(50);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'notes')
        ALTER TABLE users ADD notes NVARCHAR(MAX);
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login_at')
        ALTER TABLE users ADD last_login_at DATETIME;
    
    -- Update existing data if needed
    -- Split full_name into first_name and last_name if they exist
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'full_name')
    BEGIN
        UPDATE users 
        SET 
            first_name = CASE 
                WHEN CHARINDEX(' ', full_name) > 0 
                THEN LEFT(full_name, CHARINDEX(' ', full_name) - 1)
                ELSE full_name
            END,
            last_name = CASE 
                WHEN CHARINDEX(' ', full_name) > 0 
                THEN SUBSTRING(full_name, CHARINDEX(' ', full_name) + 1, LEN(full_name))
                ELSE ''
            END
        WHERE first_name IS NULL OR last_name IS NULL;
    END
    
    -- Set default values for new columns
    UPDATE users SET is_active = 1 WHERE is_active IS NULL;
    UPDATE users SET membership_status = 'active' WHERE membership_status IS NULL;
    
    -- Rename old columns if they exist
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone')
    BEGIN
        EXEC sp_rename 'users.phone', 'phone_number', 'COLUMN';
    END
    
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login')
    BEGIN
        EXEC sp_rename 'users.last_login', 'last_login_at', 'COLUMN';
    END
    
    PRINT 'Users table updated successfully';
END
GO

-- Update events table structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
BEGIN
    -- Rename 'date' column to 'event_date' for clarity (optional)
    -- The admin route has been fixed to use 'date', so this is not needed
    -- But we can add an alias for backward compatibility
    
    PRINT 'Events table structure is correct';
END
GO

-- Update audit_logs table structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    -- Rename entity_type to table_name if it exists
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'entity_type')
    BEGIN
        EXEC sp_rename 'audit_logs.entity_type', 'table_name', 'COLUMN';
    END
    
    -- Rename entity_id to record_id if it exists
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'entity_id')
    BEGIN
        EXEC sp_rename 'audit_logs.entity_id', 'record_id', 'COLUMN';
    END
    
    PRINT 'Audit logs table updated successfully';
END
GO

-- Create missing indexes
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_status')
        CREATE INDEX idx_users_status ON users(membership_status);
    
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_active')
        CREATE INDEX idx_users_active ON users(is_active);
END
GO

-- Update notifications table to match expected structure
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'priority')
        ALTER TABLE notifications ADD priority NVARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'created_by')
        ALTER TABLE notifications ADD created_by INT;
    
    -- Add foreign key constraint for created_by
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_notifications_created_by')
        ALTER TABLE notifications ADD CONSTRAINT FK_notifications_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id);
    
    PRINT 'Notifications table updated successfully';
END
GO

PRINT 'Migration 002 completed successfully!';
PRINT 'All table structures now match application expectations.';