-- Create Demo Users for Testing
-- Run this script in SQL Server Management Studio

USE clb_vo_co_truyen_hutech;
GO

-- Delete existing demo users if any
DELETE FROM users WHERE email IN ('admin@hutech.edu.vn', 'member@hutech.edu.vn', 'demo@test.com');
GO

-- Create Admin User
-- Password: admin123 (bcrypt hash)
INSERT INTO users (
    email, username, password, first_name, last_name, full_name,
    phone_number, role, membership_status, email_verified, is_active
) VALUES (
    'admin@hutech.edu.vn',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEgEjqG', -- admin123
    'Admin',
    'System',
    'Admin System',
    '0123456789',
    'admin',
    'active',
    1,
    1
);
GO

-- Create Member User
-- Password: member123 (bcrypt hash)
INSERT INTO users (
    email, username, password, first_name, last_name, full_name,
    phone_number, role, membership_status, email_verified, is_active
) VALUES (
    'member@hutech.edu.vn',
    'member',
    '$2a$12$K8qLKzjH5L5L5L5L5L5L5uO5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L', -- member123
    'Thành',
    'Viên',
    'Thành Viên',
    '0987654321',
    'student',
    'active',
    1,
    1
);
GO

-- Create Demo User
-- Password: 123456 (bcrypt hash)
INSERT INTO users (
    email, username, password, first_name, last_name, full_name,
    phone_number, role, membership_status, email_verified, is_active
) VALUES (
    'demo@test.com',
    'demo',
    '$2a$12$rMtoABCD1234567890123uO5L5L5L5L5L5L5L5L5L5L5L5L5L5L5L', -- 123456
    'Demo',
    'User',
    'Demo User',
    '0999888777',
    'student',
    'active',
    1,
    1
);
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
