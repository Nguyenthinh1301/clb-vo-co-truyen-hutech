USE clb_vo_co_truyen_hutech;
GO

-- Delete existing users
DELETE FROM users;
GO

-- Create admin user
-- Password: admin123456 (hashed with bcrypt)
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    'admin@vocotruyenhutech.edu.vn',
    '$2a$10$Yjo.ZcgB2c/50QOUC.d9I.WQA3rXeeMZnPdzA1TA5io/aKkZX/SWq',
    'Administrator',
    '0123456789',
    'admin',
    1
);
GO

-- Create instructor user  
-- Password: instructor123
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    'instructor@vocotruyenhutech.edu.vn',
    '$2a$10$rKZWJQXvaaQbR8H1P.Zz0.xGJ5fN8vZ8qH0yKGxJ5vZ8qH0yKGxJ5v',
    'Huấn Luyện Viên',
    '0987654321',
    'instructor',
    1
);
GO

-- Create sample student
-- Password: student123
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    'student@vocotruyenhutech.edu.vn',
    '$2a$10$sKZWJQXvaaQbR8H1P.Zz0.xGJ5fN8vZ8qH0yKGxJ5vZ8qH0yKGxJ5v',
    'Học Viên Mẫu',
    '0912345678',
    'student',
    1
);
GO

-- Verify users created
SELECT id, email, full_name, role, created_at 
FROM users
ORDER BY id;
GO

PRINT 'Users created successfully!';
PRINT 'Admin: admin@vocotruyenhutech.edu.vn / admin123456';
PRINT 'Instructor: instructor@vocotruyenhutech.edu.vn / instructor123';
PRINT 'Student: student@vocotruyenhutech.edu.vn / student123';
