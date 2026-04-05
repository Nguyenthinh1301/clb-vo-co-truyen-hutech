-- CLB Võ Cổ Truyền HUTECH Database Seed Data
-- Created: June 30, 2025
-- Initial data for development and testing

-- ===========================
-- SYSTEM SETTINGS
-- ===========================
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'CLB Võ Cổ Truyền HUTECH', 'string', 'Tên website', TRUE),
('site_description', 'Câu lạc bộ Võ cổ truyền trường Đại học Công nghệ TP.HCM', 'string', 'Mô tả website', TRUE),
('contact_email', 'info@vocotruyenhutech.edu.vn', 'string', 'Email liên hệ chính', TRUE),
('contact_phone', '+84 28 5445 7777', 'string', 'Số điện thoại liên hệ', TRUE),
('address', 'Khu Công nghệ cao TP.HCM, Xa lộ Hà Nội, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM', 'string', 'Địa chỉ trụ sở', TRUE),
('max_login_attempts', '5', 'integer', 'Số lần đăng nhập sai tối đa', FALSE),
('session_timeout', '86400', 'integer', 'Thời gian timeout session (giây)', FALSE),
('otp_expiry_minutes', '5', 'integer', 'Thời gian hết hạn OTP (phút)', FALSE),
('password_reset_expiry_hours', '1', 'integer', 'Thời gian hết hạn link reset password (giờ)', FALSE),
('email_verification_expiry_hours', '24', 'integer', 'Thời gian hết hạn link xác thực email (giờ)', FALSE),
('default_class_duration', '90', 'integer', 'Thời lượng lớp học mặc định (phút)', FALSE),
('max_students_per_class', '20', 'integer', 'Số học viên tối đa mỗi lớp', FALSE),
('enable_registration', 'true', 'boolean', 'Cho phép đăng ký tài khoản mới', TRUE),
('enable_two_factor', 'true', 'boolean', 'Bật xác thực 2 bước', FALSE),
('maintenance_mode', 'false', 'boolean', 'Chế độ bảo trì website', FALSE);

-- ===========================
-- ADMIN USER
-- ===========================
INSERT INTO users (
    email, password, first_name, last_name, phone, student_id, 
    gender, role, status, email_verified, belt_level, bio, created_at
) VALUES (
    'admin@vocotruyenhutech.edu.vn', 
    'admin123456', -- In production, this should be hashed
    'Quản trị', 
    'Viên', 
    '+84 901 234 567', 
    'ADMIN001',
    'male', 
    'admin', 
    'active', 
    TRUE, 
    'black',
    'Quản trị viên hệ thống CLB Võ Cổ Truyền HUTECH',
    CURRENT_TIMESTAMP
);

-- ===========================
-- INSTRUCTORS
-- ===========================
INSERT INTO users (
    email, password, first_name, last_name, phone, student_id,
    gender, role, status, email_verified, belt_level, bio, created_at
) VALUES 
(
    'instructor1@vocotruyenhutech.edu.vn',
    'instructor123',
    'Nguyễn Văn',
    'Sư',
    '+84 902 345 678',
    'INST001',
    'male',
    'instructor',
    'active',
    TRUE,
    'black',
    'Huấn luyện viên với 15 năm kinh nghiệm trong võ cổ truyền Việt Nam',
    CURRENT_TIMESTAMP
),
(
    'instructor2@vocotruyenhutech.edu.vn',
    'instructor123',
    'Trần Thị',
    'Mai',
    '+84 903 456 789',
    'INST002',
    'female',
    'instructor',
    'active',
    TRUE,
    'brown',
    'Chuyên gia võ cổ truyền với chuyên môn về võ Bình Định',
    CURRENT_TIMESTAMP
);

-- ===========================
-- SAMPLE STUDENTS
-- ===========================
INSERT INTO users (
    email, password, first_name, last_name, phone, student_id,
    birth_date, gender, role, status, email_verified, belt_level, 
    address, bio, created_at
) VALUES 
(
    'student1@student.hutech.edu.vn',
    'student123',
    'Lê Minh',
    'Tuấn',
    '+84 904 567 890',
    '21110001',
    '2003-05-15',
    'male',
    'student',
    'active',
    TRUE,
    'yellow',
    '123 Đường ABC, Quận 1, TP.HCM',
    'Sinh viên năm 2 khoa Công nghệ Thông tin, đam mê võ thuật truyền thống',
    CURRENT_TIMESTAMP
),
(
    'student2@student.hutech.edu.vn',
    'student123',
    'Phạm Thị',
    'Lan',
    '+84 905 678 901',
    '21110002',
    '2003-08-22',
    'female',
    'student',
    'active',
    TRUE,
    'white',
    '456 Đường XYZ, Quận 3, TP.HCM',
    'Sinh viên năm 1 khoa Kinh tế, mới bắt đầu học võ cổ truyền',
    CURRENT_TIMESTAMP
),
(
    'student3@student.hutech.edu.vn',
    'student123',
    'Hoàng Văn',
    'Nam',
    '+84 906 789 012',
    '21110003',
    '2002-12-10',
    'male',
    'student',
    'active',
    TRUE,
    'orange',
    '789 Đường DEF, Quận 7, TP.HCM',
    'Sinh viên năm 3 khoa Cơ khí, có kinh nghiệm võ thuật từ cấp 3',
    CURRENT_TIMESTAMP
);

-- ===========================
-- MARTIAL ARTS CLASSES
-- ===========================
INSERT INTO classes (
    name, description, instructor_id, level, max_students, 
    schedule_day, schedule_time, duration, location, price, created_at
) VALUES 
(
    'Võ Cổ Truyền Cơ Bản',
    'Lớp học dành cho người mới bắt đầu, tập trung vào các động tác cơ bản và triết lý võ thuật',
    2, -- instructor1
    'beginner',
    15,
    'tuesday',
    '18:00:00',
    90,
    'Phòng tập A1 - Tòa nhà A',
    200000,
    CURRENT_TIMESTAMP
),
(
    'Võ Cổ Truyền Nâng Cao',
    'Lớp học dành cho học viên có kinh nghiệm, luyện tập các bài quyền phức tạp',
    2, -- instructor1
    'advanced',
    12,
    'thursday',
    '19:00:00',
    120,
    'Phòng tập A2 - Tòa nhà A',
    350000,
    CURRENT_TIMESTAMP
),
(
    'Võ Bình Định Truyền Thống',
    'Lớp học chuyên về võ Bình Định với các bài quyền và khí công đặc trưng',
    3, -- instructor2
    'intermediate',
    10,
    'saturday',
    '08:00:00',
    90,
    'Sân tập ngoài trời - Khu B',
    300000,
    CURRENT_TIMESTAMP
);

-- ===========================
-- CLASS ENROLLMENTS
-- ===========================
INSERT INTO class_enrollments (user_id, class_id, enrollment_date, status, payment_status) VALUES 
(4, 1, CURRENT_TIMESTAMP, 'active', 'paid'), -- student1 in basic class
(5, 1, CURRENT_TIMESTAMP, 'active', 'paid'), -- student2 in basic class
(6, 1, CURRENT_TIMESTAMP, 'active', 'pending'), -- student3 in basic class
(6, 3, CURRENT_TIMESTAMP, 'active', 'paid'); -- student3 in intermediate class

-- ===========================
-- SAMPLE EVENTS
-- ===========================
INSERT INTO events (
    title, description, event_type, start_date, end_date, location,
    max_participants, registration_fee, registration_deadline, organizer_id, status
) VALUES 
(
    'Giải Võ Cổ Truyền Sinh Viên 2025',
    'Giải thi đấu võ cổ truyền dành cho sinh viên các trường đại học tại TP.HCM',
    'tournament',
    '2025-08-15 08:00:00',
    '2025-08-15 17:00:00',
    'Nhà thi đấu Phan Đình Phùng',
    100,
    50000,
    '2025-08-01 23:59:59',
    1, -- admin
    'upcoming'
),
(
    'Workshop Võ Thuật Truyền Thống',
    'Hội thảo về lịch sử và triết lý võ thuật cổ truyền Việt Nam',
    'workshop',
    '2025-07-20 14:00:00',
    '2025-07-20 17:00:00',
    'Hội trường A - HUTECH',
    50,
    0,
    '2025-07-15 23:59:59',
    2, -- instructor1
    'upcoming'
);

-- ===========================
-- SAMPLE NOTIFICATIONS
-- ===========================
INSERT INTO notifications (user_id, title, message, type, category, created_at) VALUES 
(4, 'Chào mừng bạn đến với CLB!', 'Cảm ơn bạn đã tham gia CLB Võ Cổ Truyền HUTECH. Chúc bạn có những trải nghiệm tuyệt vời!', 'success', 'system', CURRENT_TIMESTAMP),
(4, 'Lịch học tuần này', 'Lớp Võ Cổ Truyền Cơ Bản sẽ diễn ra vào Thứ 3, 18:00 tại Phòng A1', 'info', 'class', CURRENT_TIMESTAMP),
(5, 'Chào mừng bạn đến với CLB!', 'Cảm ơn bạn đã tham gia CLB Võ Cổ Truyền HUTECH. Chúc bạn có những trải nghiệm tuyệt vời!', 'success', 'system', CURRENT_TIMESTAMP),
(6, 'Thanh toán học phí', 'Bạn còn học phí chưa thanh toán cho lớp Võ Cổ Truyền Cơ Bản. Vui lòng thanh toán trước ngày 30/07/2025.', 'warning', 'payment', CURRENT_TIMESTAMP);

-- ===========================
-- SAMPLE BELT PROMOTIONS
-- ===========================
INSERT INTO belt_promotions (
    user_id, from_belt, to_belt, promotion_date, promoted_by, 
    requirements_met, notes, certificate_issued
) VALUES 
(4, 'white', 'yellow', '2025-06-01', 2, 'Hoàn thành bài quyền cơ bản, thể hiện tinh thần võ đạo tốt', 'Học viên có tiến bộ vượt trội', TRUE),
(6, 'white', 'orange', '2025-05-15', 2, 'Thành thạo các động tác cơ bản và trung cấp', 'Có kinh nghiệm từ trước', TRUE);

-- ===========================
-- SAMPLE PAYMENTS
-- ===========================
INSERT INTO payments (
    user_id, amount, payment_method, payment_type, reference_id, reference_type,
    transaction_id, status, payment_date, notes, processed_by
) VALUES 
(4, 200000, 'bank_transfer', 'class_fee', 1, 'class', 'TXN202506001', 'completed', '2025-06-01 10:30:00', 'Học phí tháng 6/2025', 1),
(5, 200000, 'cash', 'class_fee', 1, 'class', 'CASH202506001', 'completed', '2025-06-01 18:00:00', 'Thanh toán tại lớp', 2),
(6, 300000, 'e_wallet', 'class_fee', 3, 'class', 'WALLET202506001', 'completed', '2025-06-01 20:15:00', 'Thanh toán qua ví điện tử', 1);

-- ===========================
-- SAMPLE ATTENDANCE
-- ===========================
INSERT INTO attendance (user_id, class_id, attendance_date, status, recorded_by) VALUES 
(4, 1, '2025-06-04', 'present', 2),
(5, 1, '2025-06-04', 'present', 2),
(6, 1, '2025-06-04', 'late', 2),
(4, 1, '2025-06-11', 'present', 2),
(5, 1, '2025-06-11', 'absent', 2),
(6, 1, '2025-06-11', 'present', 2),
(6, 3, '2025-06-08', 'present', 3),
(6, 3, '2025-06-15', 'present', 3);
