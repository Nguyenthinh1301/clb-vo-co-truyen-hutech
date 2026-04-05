-- Sample Data for Points System
-- Dữ liệu mẫu cho hệ thống tích điểm

USE clb_vo_co_truyen_hutech;
GO

PRINT 'Inserting sample data for Points System...';
PRINT '';

-- =============================================
-- 1. Points Rules (Quy tắc tính điểm)
-- =============================================
PRINT '1. Inserting points rules...';

INSERT INTO points_rules (name, description, category, points, is_active) VALUES
('Điểm danh lớp học', 'Điểm danh có mặt tại lớp học (tối đa 10 điểm)', 'attendance', 10, 1),
('Tham gia sự kiện', 'Tham gia sự kiện do CLB tổ chức (tối đa 20 điểm)', 'event', 20, 1),
('Thi đấu giải võ', 'Tham gia thi đấu giải võ (tối đa 50 điểm)', 'event', 50, 1),
('Giới thiệu thành viên mới', 'Giới thiệu người mới tham gia CLB (tối đa 30 điểm)', 'achievement', 30, 1),
('Hoàn thành bài tập', 'Hoàn thành bài tập được giao (tối đa 15 điểm)', 'achievement', 15, 1),
('Đạt thành tích xuất sắc', 'Đạt giải trong các cuộc thi (tối đa 100 điểm)', 'achievement', 100, 1),
('Điểm danh hàng ngày', 'Check-in hàng ngày trên app (tối đa 5 điểm)', 'daily', 5, 1),
('Tập luyện 30 phút', 'Hoàn thành 30 phút tập luyện (tối đa 10 điểm)', 'daily', 10, 1),
('Chia sẻ bài viết CLB', 'Chia sẻ bài viết của CLB lên mạng xã hội (tối đa 5 điểm)', 'daily', 5, 1);

PRINT '  ✅ Inserted 9 points rules';
GO

-- =============================================
-- 2. Rewards (Phần quà)
-- =============================================
PRINT '2. Inserting rewards...';

INSERT INTO rewards (name, description, points_required, category, stock_quantity, is_active, display_order) VALUES
('Bình nước CLB', 'Bình nước thể thao có logo CLB', 15, 'merchandise', 100, 1, 1),
('Áo CLB Võ Cổ Truyền', 'Áo thun chính thức của CLB với logo đẹp', 30, 'merchandise', 50, 1, 2),
('Túi tập võ', 'Túi đựng đồ tập võ tiện dụng', 40, 'merchandise', 40, 1, 3),
('Găng tay võ', 'Găng tay tập luyện chất lượng cao', 50, 'merchandise', 30, 1, 4),
('Voucher 100k', 'Voucher mua sắm dụng cụ võ trị giá 100k', 60, 'discount', 20, 1, 5),
('Đai võ màu', 'Đai võ các màu theo cấp độ', 70, 'merchandise', 20, 1, 6),
('Giảm 50% học phí', 'Giảm 50% học phí cho khóa học tiếp theo', 85, 'discount', 10, 1, 7),
('Buổi tập riêng với HLV', 'Một buổi tập riêng 1-1 với huấn luyện viên', 90, 'special', 5, 1, 8),
('Khóa học miễn phí', 'Một khóa học miễn phí bất kỳ', 100, 'course', 5, 1, 9),
('Vé tham quan võ đường nổi tiếng', 'Vé tham quan và học hỏi tại võ đường nổi tiếng', 100, 'special', 3, 1, 10);

PRINT '  ✅ Inserted 10 rewards';
GO

-- =============================================
-- 3. Achievements (Thành tích)
-- =============================================
PRINT '3. Inserting achievements...';

INSERT INTO achievements (name, description, icon, points_reward, category, is_active) VALUES
('Người mới bắt đầu', 'Hoàn thành buổi tập đầu tiên', '🎯', 5, 'streak', 1),
('Streak 7 ngày', 'Điểm danh liên tục 7 ngày', '🔥', 15, 'streak', 1),
('Streak 30 ngày', 'Điểm danh liên tục 30 ngày', '⚡', 30, 'streak', 1),
('Siêng năng', 'Tham gia 50 buổi tập', '💪', 25, 'attendance', 1),
('Chuyên cần', 'Tham gia 100 buổi tập', '🏆', 40, 'attendance', 1),
('Người tham gia tích cực', 'Tham gia 10 sự kiện', '🎉', 20, 'event', 1),
('Đại sứ CLB', 'Giới thiệu 5 thành viên mới', '👥', 35, 'special', 1),
('Top 10 tháng', 'Lọt top 10 bảng xếp hạng tháng', '🥇', 50, 'special', 1),
('Thành viên xuất sắc', 'Được bình chọn thành viên xuất sắc', '⭐', 50, 'special', 1),
('Võ sĩ Kim Cương', 'Đạt 100 điểm tích lũy', '👑', 10, 'special', 1);

PRINT '  ✅ Inserted 10 achievements';
GO

-- =============================================
-- 4. Sample User Points (Điểm mẫu cho users)
-- =============================================
PRINT '4. Creating sample user points...';

-- Lấy danh sách users (trừ admin)
DECLARE @user_id INT;
DECLARE @counter INT = 0;

DECLARE user_cursor CURSOR FOR
SELECT id FROM users WHERE role != 'admin' AND is_active = 1;

OPEN user_cursor;
FETCH NEXT FROM user_cursor INTO @user_id;

WHILE @@FETCH_STATUS = 0 AND @counter < 10
BEGIN
    -- Tạo điểm ngẫu nhiên cho mỗi user (thang điểm 100)
    DECLARE @random_points INT = FLOOR(RAND() * 95) + 5; -- 5-100 điểm
    DECLARE @streak INT = FLOOR(RAND() * 15) + 1; -- 1-15 ngày
    
    INSERT INTO user_points (user_id, total_points, available_points, streak_days, last_activity_date)
    VALUES (@user_id, @random_points, @random_points, @streak, CAST(GETDATE() AS DATE));
    
    -- Cập nhật rank (thang điểm 100)
    DECLARE @rank NVARCHAR(50);
    SET @rank = CASE
        WHEN @random_points >= 90 THEN 'diamond'
        WHEN @random_points >= 60 THEN 'gold'
        WHEN @random_points >= 30 THEN 'silver'
        ELSE 'bronze'
    END;
    
    UPDATE user_points SET rank_level = @rank WHERE user_id = @user_id;
    
    SET @counter = @counter + 1;
    FETCH NEXT FROM user_cursor INTO @user_id;
END

CLOSE user_cursor;
DEALLOCATE user_cursor;

PRINT '  ✅ Created sample points for users';
GO

-- =============================================
-- 5. Sample Transactions (Giao dịch mẫu)
-- =============================================
PRINT '5. Creating sample transactions...';

-- Lấy user đầu tiên để tạo transactions mẫu
DECLARE @sample_user_id INT;
SELECT TOP 1 @sample_user_id = user_id FROM user_points ORDER BY total_points DESC;

IF @sample_user_id IS NOT NULL
BEGIN
    INSERT INTO points_transactions (user_id, points, type, category, description, created_at) VALUES
    (@sample_user_id, 10, 'earn', 'attendance', 'Điểm danh lớp Võ Cơ Bản', DATEADD(day, -7, GETDATE())),
    (@sample_user_id, 20, 'earn', 'event', 'Tham gia sự kiện Giao lưu võ thuật', DATEADD(day, -5, GETDATE())),
    (@sample_user_id, 10, 'earn', 'attendance', 'Điểm danh lớp Võ Cơ Bản', DATEADD(day, -4, GETDATE())),
    (@sample_user_id, 15, 'earn', 'achievement', 'Hoàn thành bài tập tuần 1', DATEADD(day, -3, GETDATE())),
    (@sample_user_id, 15, 'earn', 'achievement', 'Đạt thành tích Streak 7 ngày', DATEADD(day, -2, GETDATE())),
    (@sample_user_id, 10, 'earn', 'attendance', 'Điểm danh lớp Võ Cơ Bản', DATEADD(day, -1, GETDATE())),
    (@sample_user_id, 5, 'earn', 'daily', 'Check-in hàng ngày', GETDATE());
    
    PRINT '  ✅ Created 7 sample transactions';
END
GO

-- =============================================
-- Summary
-- =============================================
PRINT '';
PRINT '═══════════════════════════════════════════════════════';
PRINT '✅ Sample Data Inserted Successfully!';
PRINT '═══════════════════════════════════════════════════════';
PRINT '';
PRINT 'Data inserted:';
PRINT '  ✅ 9 points rules';
PRINT '  ✅ 10 rewards';
PRINT '  ✅ 10 achievements';
PRINT '  ✅ Sample user points';
PRINT '  ✅ Sample transactions';
PRINT '';
PRINT 'You can now:';
PRINT '  1. View leaderboard: SELECT * FROM v_leaderboard';
PRINT '  2. Check user points: SELECT * FROM user_points';
PRINT '  3. View rewards: SELECT * FROM rewards';
PRINT '  4. Test add points: EXEC sp_add_points @user_id=1, @points=50, @category=''test'', @description=''Test points''';
PRINT '';
GO
