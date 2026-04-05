-- Microsoft SQL Server Schema
-- CLB Võ Cổ Truyền HUTECH Database

-- Create database if not exists
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'clb_vo_co_truyen_hutech')
BEGIN
    CREATE DATABASE clb_vo_co_truyen_hutech;
END
GO

USE clb_vo_co_truyen_hutech;
GO

-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) NOT NULL UNIQUE,
        username NVARCHAR(255),
        password NVARCHAR(255) NOT NULL,
        first_name NVARCHAR(255),
        last_name NVARCHAR(255),
        full_name NVARCHAR(255),
        phone_number NVARCHAR(20),
        date_of_birth DATE,
        gender NVARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        address NVARCHAR(500),
        avatar NVARCHAR(500),
        role NVARCHAR(50) DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'student', 'member')),
        membership_status NVARCHAR(50) DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'pending')),
        is_active BIT DEFAULT 1,
        belt_level NVARCHAR(50),
        notes NVARCHAR(MAX),
        two_factor_enabled BIT DEFAULT 0,
        two_factor_secret NVARCHAR(255),
        email_verified BIT DEFAULT 0,
        last_login_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_status ON users(membership_status);
    CREATE INDEX idx_users_active ON users(is_active);
END
GO

-- User Sessions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_sessions')
BEGIN
    CREATE TABLE user_sessions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash NVARCHAR(500) NOT NULL UNIQUE,
        refresh_token_hash NVARCHAR(500),
        device_info NVARCHAR(MAX),
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(500),
        expires_at DATETIME NOT NULL,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
    CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
END
GO

-- Login Attempts table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE login_attempts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255),
        ip_address NVARCHAR(45) NOT NULL,
        user_agent NVARCHAR(500),
        success BIT DEFAULT 0,
        failure_reason NVARCHAR(255),
        attempted_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_login_attempts_email ON login_attempts(email);
    CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
    CREATE INDEX idx_login_attempts_date ON login_attempts(attempted_at);
END
GO

-- Classes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'classes')
BEGIN
    CREATE TABLE classes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        instructor_id INT,
        schedule NVARCHAR(500),
        location NVARCHAR(255),
        max_students INT DEFAULT 30,
        current_students INT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_classes_instructor ON classes(instructor_id);
    CREATE INDEX idx_classes_status ON classes(status);
END
GO

-- Class enrollments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'class_enrollments')
BEGIN
    CREATE TABLE class_enrollments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        class_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
        enrolled_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (class_id, user_id)
    );
    CREATE INDEX idx_enrollments_class ON class_enrollments(class_id);
    CREATE INDEX idx_enrollments_user ON class_enrollments(user_id);
END
GO

-- Events table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
BEGIN
    CREATE TABLE events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        type NVARCHAR(50) CHECK (type IN ('tournament', 'demonstration', 'workshop', 'seminar', 'other')),
        location NVARCHAR(255),
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        max_participants INT,
        current_participants INT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
        image NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_events_date ON events(date);
    CREATE INDEX idx_events_status ON events(status);
END
GO

-- Event registrations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_registrations')
BEGIN
    CREATE TABLE event_registrations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(50) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
        registered_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (event_id, user_id)
    );
    CREATE INDEX idx_event_reg_event ON event_registrations(event_id);
    CREATE INDEX idx_event_reg_user ON event_registrations(user_id);
END
GO

-- Attendance table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance')
BEGIN
    CREATE TABLE attendance (
        id INT IDENTITY(1,1) PRIMARY KEY,
        class_id INT NOT NULL,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        status NVARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
        notes NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_attendance_class ON attendance(class_id);
    CREATE INDEX idx_attendance_user ON attendance(user_id);
    CREATE INDEX idx_attendance_date ON attendance(date);
END
GO

-- Notifications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        type NVARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')),
        is_read BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_notifications_user ON notifications(user_id);
    CREATE INDEX idx_notifications_read ON notifications(is_read);
END
GO

-- Contact messages table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contact_messages')
BEGIN
    CREATE TABLE contact_messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(20),
        subject NVARCHAR(255),
        message NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
        replied_by INT,
        replied_at DATETIME,
        reply_message NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_contact_status ON contact_messages(status);
    CREATE INDEX idx_contact_email ON contact_messages(email);
END
GO

-- Belt Promotions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'belt_promotions')
BEGIN
    CREATE TABLE belt_promotions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        from_belt NVARCHAR(50),
        to_belt NVARCHAR(50) NOT NULL,
        promoted_by INT NOT NULL,
        promotion_date DATE NOT NULL,
        requirements_met NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        certificate_issued BIT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (promoted_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    CREATE INDEX idx_belt_promotions_user ON belt_promotions(user_id);
    CREATE INDEX idx_belt_promotions_date ON belt_promotions(promotion_date);
END
GO

-- Announcements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'announcements')
BEGIN
    CREATE TABLE announcements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        type NVARCHAR(50) DEFAULT 'general',
        priority NVARCHAR(50) DEFAULT 'normal',
        target_audience NVARCHAR(50) DEFAULT 'all',
        status NVARCHAR(50) DEFAULT 'active',
        created_by INT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_announcements_status ON announcements(status);
    CREATE INDEX idx_announcements_type ON announcements(type);
END
GO

-- News table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'news')
BEGIN
    CREATE TABLE news (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        excerpt NVARCHAR(500),
        category NVARCHAR(50) DEFAULT 'general',
        tags NVARCHAR(500),
        featured_image NVARCHAR(500),
        author_id INT,
        status NVARCHAR(50) DEFAULT 'draft',
        published_at DATETIME,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_news_status ON news(status);
    CREATE INDEX idx_news_category ON news(category);
    CREATE INDEX idx_news_published ON news(published_at);
END
GO

-- User Points table
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
END
GO

-- Points Transactions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'points_transactions')
BEGIN
    CREATE TABLE points_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        points INT NOT NULL,
        type NVARCHAR(50) NOT NULL,
        category NVARCHAR(50),
        description NVARCHAR(500),
        reference_id INT,
        reference_type NVARCHAR(50),
        created_by INT,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    CREATE INDEX idx_points_trans_user ON points_transactions(user_id);
    CREATE INDEX idx_points_trans_type ON points_transactions(type);
    CREATE INDEX idx_points_trans_date ON points_transactions(created_at DESC);
END
GO

-- Rewards table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rewards')
BEGIN
    CREATE TABLE rewards (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        points_required INT NOT NULL,
        category NVARCHAR(50),
        image_url NVARCHAR(500),
        stock_quantity INT DEFAULT 0,
        is_active BIT DEFAULT 1,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_rewards_active ON rewards(is_active);
    CREATE INDEX idx_rewards_points ON rewards(points_required);
END
GO

-- Achievements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'achievements')
BEGIN
    CREATE TABLE achievements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        icon NVARCHAR(100),
        points_reward INT DEFAULT 0,
        category NVARCHAR(50),
        requirement NVARCHAR(MAX),
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- User Achievements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_achievements')
BEGIN
    CREATE TABLE user_achievements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        achievement_id INT NOT NULL,
        earned_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE (user_id, achievement_id)
    );
    CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
END
GO

-- View: Leaderboard
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

-- Stored Procedure: Add Points
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
        INSERT INTO points_transactions (user_id, points, type, category, description, reference_id, reference_type, created_by)
        VALUES (@user_id, @points, 'earn', @category, @description, @reference_id, @reference_type, @created_by);

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

PRINT 'Database schema created successfully!';
