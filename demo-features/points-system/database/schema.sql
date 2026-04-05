-- Points System Database Schema
-- Hệ thống tích điểm cho thành viên CLB

USE clb_vo_co_truyen_hutech;
GO

-- =============================================
-- 1. Bảng User Points (Điểm của thành viên)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_points')
BEGIN
    CREATE TABLE user_points (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        total_points INT DEFAULT 0,
        available_points INT DEFAULT 0,
        spent_points INT DEFAULT 0,
        rank_level NVARCHAR(50) DEFAULT 'bronze',
        streak_days INT DEFAULT 0,
        last_activity_date DATE,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX idx_user_points_user_id ON user_points(user_id);
    CREATE INDEX idx_user_points_total ON user_points(total_points DESC);
    CREATE INDEX idx_user_points_rank ON user_points(rank_level);
    
    PRINT '✅ Table user_points created';
END
GO

-- =============================================
-- 2. Bảng Points Transactions (Lịch sử giao dịch điểm)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_transactions')
BEGIN
    CREATE TABLE points_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        points INT NOT NULL,
        type NVARCHAR(50) NOT NULL, -- earn, spend, bonus, penalty
        category NVARCHAR(50), -- attendance, event, achievement, reward
        description NVARCHAR(500),
        reference_id INT, -- ID của activity liên quan
        reference_type NVARCHAR(50), -- class, event, reward
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_points_trans_user ON points_transactions(user_id);
    CREATE INDEX idx_points_trans_type ON points_transactions(type);
    CREATE INDEX idx_points_trans_date ON points_transactions(created_at DESC);
    
    PRINT '✅ Table points_transactions created';
END
GO

-- =============================================
-- 3. Bảng Rewards (Phần quà đổi điểm)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rewards')
BEGIN
    CREATE TABLE rewards (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        points_required INT NOT NULL,
        category NVARCHAR(50), -- merchandise, discount, course, special
        image_url NVARCHAR(500),
        stock_quantity INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_rewards_active ON rewards(is_active);
    CREATE INDEX idx_rewards_points ON rewards(points_required);
    
    PRINT '✅ Table rewards created';
END
GO

-- =============================================
-- 4. Bảng Reward Redemptions (Lịch sử đổi quà)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'reward_redemptions')
BEGIN
    CREATE TABLE reward_redemptions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        reward_id INT NOT NULL,
        points_spent INT NOT NULL,
        status NVARCHAR(50) DEFAULT 'pending', -- pending, approved, delivered, cancelled
        redemption_code NVARCHAR(50),
        notes NVARCHAR(MAX),
        approved_by INT,
        approved_at DATETIME,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE NO ACTION,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_redemptions_user ON reward_redemptions(user_id);
    CREATE INDEX idx_redemptions_status ON reward_redemptions(status);
    CREATE INDEX idx_redemptions_date ON reward_redemptions(created_at DESC);
    
    PRINT '✅ Table reward_redemptions created';
END
GO

-- =============================================
-- 5. Bảng Points Rules (Quy tắc tính điểm)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_rules')
BEGIN
    CREATE TABLE points_rules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        category NVARCHAR(50) NOT NULL, -- attendance, event, achievement, daily
        points INT NOT NULL,
        is_active BIT DEFAULT 1,
        conditions NVARCHAR(MAX), -- JSON format
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_points_rules_category ON points_rules(category);
    CREATE INDEX idx_points_rules_active ON points_rules(is_active);
    
    PRINT '✅ Table points_rules created';
END
GO

-- =============================================
-- 6. Bảng Achievements (Thành tích)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'achievements')
BEGIN
    CREATE TABLE achievements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        icon NVARCHAR(100),
        points_reward INT DEFAULT 0,
        category NVARCHAR(50), -- streak, attendance, event, special
        requirement NVARCHAR(MAX), -- JSON format
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE()
    );
    
    PRINT '✅ Table achievements created';
END
GO

-- =============================================
-- 7. Bảng User Achievements (Thành tích của user)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_achievements')
BEGIN
    CREATE TABLE user_achievements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        achievement_id INT NOT NULL,
        earned_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE(user_id, achievement_id)
    );
    
    CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
    
    PRINT '✅ Table user_achievements created';
END
GO

-- =============================================
-- 8. View: Leaderboard (Bảng xếp hạng)
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'v_leaderboard')
    DROP VIEW v_leaderboard;
GO

CREATE VIEW v_leaderboard AS
SELECT 
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank,
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    up.total_points,
    up.available_points,
    up.rank_level,
    up.streak_days,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) as achievement_count
FROM user_points up
INNER JOIN users u ON up.user_id = u.id
WHERE u.is_active = 1 AND u.role != 'admin';
GO

PRINT '✅ View v_leaderboard created';
GO

-- =============================================
-- 9. Stored Procedure: Add Points
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_add_points')
    DROP PROCEDURE sp_add_points;
GO

CREATE PROCEDURE sp_add_points
    @user_id INT,
    @points INT,
    @category NVARCHAR(50),
    @description NVARCHAR(500),
    @reference_id INT = NULL,
    @reference_type NVARCHAR(50) = NULL,
    @created_by INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Insert transaction
        INSERT INTO points_transactions (user_id, points, type, category, description, reference_id, reference_type, created_by)
        VALUES (@user_id, @points, 'earn', @category, @description, @reference_id, @reference_type, @created_by);
        
        -- Update user points
        IF EXISTS (SELECT 1 FROM user_points WHERE user_id = @user_id)
        BEGIN
            UPDATE user_points 
            SET total_points = total_points + @points,
                available_points = available_points + @points,
                last_activity_date = CAST(GETDATE() AS DATE),
                updated_at = GETDATE()
            WHERE user_id = @user_id;
        END
        ELSE
        BEGIN
            INSERT INTO user_points (user_id, total_points, available_points, last_activity_date)
            VALUES (@user_id, @points, @points, CAST(GETDATE() AS DATE));
        END
        
        -- Update rank
        DECLARE @total_points INT;
        SELECT @total_points = total_points FROM user_points WHERE user_id = @user_id;
        
        DECLARE @new_rank NVARCHAR(50);
        SET @new_rank = CASE
            WHEN @total_points >= 1000 THEN 'legendary'
            WHEN @total_points >= 600 THEN 'diamond'
            WHEN @total_points >= 300 THEN 'gold'
            WHEN @total_points >= 100 THEN 'silver'
            ELSE 'bronze'
        END;
        
        UPDATE user_points SET rank_level = @new_rank WHERE user_id = @user_id;
        
        COMMIT TRANSACTION;
        
        SELECT 'success' as status, @points as points_added, @new_rank as new_rank;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 'error' as status, ERROR_MESSAGE() as message;
    END CATCH
END
GO

PRINT '✅ Stored procedure sp_add_points created';
GO

-- =============================================
-- Summary
-- =============================================
PRINT '';
PRINT '═══════════════════════════════════════════════════════';
PRINT '✅ Points System Database Schema Created Successfully!';
PRINT '═══════════════════════════════════════════════════════';
PRINT '';
PRINT 'Tables created:';
PRINT '  1. user_points - Điểm của thành viên';
PRINT '  2. points_transactions - Lịch sử giao dịch';
PRINT '  3. rewards - Phần quà';
PRINT '  4. reward_redemptions - Lịch sử đổi quà';
PRINT '  5. points_rules - Quy tắc tính điểm';
PRINT '  6. achievements - Thành tích';
PRINT '  7. user_achievements - Thành tích của user';
PRINT '';
PRINT 'Views created:';
PRINT '  - v_leaderboard - Bảng xếp hạng';
PRINT '';
PRINT 'Stored procedures:';
PRINT '  - sp_add_points - Thêm điểm cho user';
PRINT '';
PRINT 'Next step: Run sample-data.sql to insert demo data';
PRINT '';
GO
