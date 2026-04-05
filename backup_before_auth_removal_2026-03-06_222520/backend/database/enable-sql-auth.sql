-- Enable SQL Server Authentication and create login
USE master;
GO

-- Enable mixed mode authentication
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode', 
    REG_DWORD, 
    2;
GO

-- Create SQL login
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'clb_admin')
BEGIN
    CREATE LOGIN clb_admin WITH PASSWORD = 'CLB@Hutech2026!', CHECK_POLICY = OFF;
END
GO

-- Grant sysadmin role
ALTER SERVER ROLE sysadmin ADD MEMBER clb_admin;
GO

-- Use the database
USE clb_vo_co_truyen_hutech;
GO

-- Create database user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'clb_admin')
BEGIN
    CREATE USER clb_admin FOR LOGIN clb_admin;
END
GO

-- Grant permissions
ALTER ROLE db_owner ADD MEMBER clb_admin;
GO

PRINT 'SQL Authentication enabled successfully!';
PRINT 'Login: clb_admin';
PRINT 'Password: CLB@Hutech2026!';
PRINT '';
PRINT 'IMPORTANT: Restart SQL Server service for changes to take effect!';
