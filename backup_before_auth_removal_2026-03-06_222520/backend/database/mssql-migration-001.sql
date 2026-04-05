-- Migration 001: Add missing columns to users table
-- Adds columns expected by auth routes

USE clb_vo_co_truyen_hutech;
GO

-- Add username column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'username')
BEGIN
    ALTER TABLE users ADD username NVARCHAR(100) NULL;
    CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
    PRINT 'Added username column';
END
GO

-- Rename password to password_hash
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'password')
BEGIN
    EXEC sp_rename 'users.password', 'password_hash', 'COLUMN';
    PRINT 'Renamed password to password_hash';
END
GO

-- Add first_name and last_name columns
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'first_name')
BEGIN
    ALTER TABLE users ADD first_name NVARCHAR(100) NULL;
    PRINT 'Added first_name column';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_name')
BEGIN
    ALTER TABLE users ADD last_name NVARCHAR(100) NULL;
    PRINT 'Added last_name column';
END
GO

-- Rename phone to phone_number
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone')
BEGIN
    EXEC sp_rename 'users.phone', 'phone_number', 'COLUMN';
    PRINT 'Renamed phone to phone_number';
END
GO

-- Add additional user fields
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'date_of_birth')
BEGIN
    ALTER TABLE users ADD date_of_birth DATE NULL;
    PRINT 'Added date_of_birth column';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'gender')
BEGIN
    ALTER TABLE users ADD gender NVARCHAR(20) NULL CHECK (gender IN ('male', 'female', 'other', NULL));
    PRINT 'Added gender column';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'address')
BEGIN
    ALTER TABLE users ADD address NVARCHAR(500) NULL;
    PRINT 'Added address column';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'profile_image')
BEGIN
    ALTER TABLE users ADD profile_image NVARCHAR(500) NULL;
    PRINT 'Added profile_image column';
END
GO

-- Rename status to membership_status
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'status')
BEGIN
    EXEC sp_rename 'users.status', 'membership_status', 'COLUMN';
    PRINT 'Renamed status to membership_status';
END
GO

-- Add is_active column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_active')
BEGIN
    ALTER TABLE users ADD is_active BIT DEFAULT 1;
    PRINT 'Added is_active column';
END
GO

-- Add belt_level column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'belt_level')
BEGIN
    ALTER TABLE users ADD belt_level NVARCHAR(50) NULL;
    PRINT 'Added belt_level column';
END
GO

-- Add join_date column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'join_date')
BEGIN
    ALTER TABLE users ADD join_date DATE NULL;
    PRINT 'Added join_date column';
END
GO

-- Rename last_login to last_login_at
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_login')
BEGIN
    EXEC sp_rename 'users.last_login', 'last_login_at', 'COLUMN';
    PRINT 'Renamed last_login to last_login_at';
END
GO

-- Update existing users to have username from email
UPDATE users 
SET username = LEFT(email, CHARINDEX('@', email) - 1)
WHERE username IS NULL;
GO

-- Split full_name into first_name and last_name
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
GO

-- Add login_attempts table if not exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE login_attempts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL,
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        success BIT DEFAULT 0,
        failure_reason NVARCHAR(255),
        attempted_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX idx_login_attempts_date ON login_attempts(attempted_at);
    PRINT 'Created login_attempts table';
END
GO

-- Add user_sessions table if not exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
BEGIN
    CREATE TABLE user_sessions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token NVARCHAR(500) NOT NULL UNIQUE,
        refresh_token NVARCHAR(500) UNIQUE,
        device_info NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        is_active BIT DEFAULT 1,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_user_sessions_token ON user_sessions(token);
    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);
    PRINT 'Created user_sessions table';
END
GO

-- Update audit_logs table to match expected schema
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'entity_type')
BEGIN
    EXEC sp_rename 'audit_logs.entity_type', 'table_name', 'COLUMN';
    PRINT 'Renamed entity_type to table_name in audit_logs';
END
GO

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'entity_id')
BEGIN
    EXEC sp_rename 'audit_logs.entity_id', 'record_id', 'COLUMN';
    PRINT 'Renamed entity_id to record_id in audit_logs';
END
GO

PRINT 'Migration 001 completed successfully!';
GO
