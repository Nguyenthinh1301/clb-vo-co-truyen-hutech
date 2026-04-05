-- Insert Demo Users for Testing
-- Generated password hashes using bcrypt
-- Run this in SQL Server Management Studio

USE clb_vo_co_truyen_hutech;
GO

-- Delete existing demo users
DELETE FROM users WHERE email IN ('admin@hutech.edu.vn', 'member@hutech.edu.vn', 'demo@test.com');
GO

-- admin@hutech.edu.vn / admin123
INSERT INTO users (email, username, password, first_name, last_name, full_name, role, membership_status, email_verified, is_active)
VALUES ('admin@hutech.edu.vn', 'admin', '$2a$12$lwe3Gh5.zA8gpNE6CVjQH.8/8obzRTYF34X1iQUWOoRH8XQz4oP2C', 'Admin', 'System', 'Admin System', 'admin', 'active', 1, 1);
GO

-- member@hutech.edu.vn / member123
INSERT INTO users (email, username, password, first_name, last_name, full_name, role, membership_status, email_verified, is_active)
VALUES ('member@hutech.edu.vn', 'member', '$2a$12$0hYd6.mstB.I/J5KHmp7mOfmUp3NbA.SzH1dZK4tCUWLbslHtfb1m', 'Thành', 'Viên', 'Thành Viên', 'student', 'active', 1, 1);
GO

-- demo@test.com / 123456
INSERT INTO users (email, username, password, first_name, last_name, full_name, role, membership_status, email_verified, is_active)
VALUES ('demo@test.com', 'demo', '$2a$12$EPvGoLHShrC9px5Evq5UQOinaaSNX/qcKALVGJHXYAYbAZbsPM9SS', 'Demo', 'User', 'Demo User', 'student', 'active', 1, 1);
GO

-- Verify users created
SELECT id, email, username, full_name, role, membership_status, is_active
FROM users
WHERE email IN ('admin@hutech.edu.vn', 'member@hutech.edu.vn', 'demo@test.com');
GO

PRINT '✅ Demo users created successfully!';
PRINT '';
PRINT 'Login credentials:';
PRINT '  Admin: admin@hutech.edu.vn / admin123';
PRINT '  Member: member@hutech.edu.vn / member123';
PRINT '  Demo: demo@test.com / 123456';
GO
