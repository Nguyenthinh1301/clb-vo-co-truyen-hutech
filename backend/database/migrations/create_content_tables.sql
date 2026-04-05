-- Create announcements table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'announcements')
BEGIN
    CREATE TABLE announcements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        type NVARCHAR(50) DEFAULT 'general', -- general, urgent, info, warning
        priority NVARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
        target_audience NVARCHAR(50) DEFAULT 'all', -- all, student, instructor, admin
        status NVARCHAR(20) DEFAULT 'active', -- active, inactive, expired
        created_by INT NOT NULL,
        expires_at DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_announcements_status ON announcements(status);
    CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
    CREATE INDEX idx_announcements_expires_at ON announcements(expires_at);
    
    PRINT 'Table announcements created successfully';
END
ELSE
BEGIN
    PRINT 'Table announcements already exists';
END
GO

-- Create news table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'news')
BEGIN
    CREATE TABLE news (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        excerpt NVARCHAR(500) NULL,
        category NVARCHAR(50) DEFAULT 'general', -- general, event, achievement, training
        tags NVARCHAR(MAX) NULL, -- JSON array of tags
        featured_image NVARCHAR(500) NULL,
        author_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'draft', -- draft, published, archived
        views INT DEFAULT 0,
        published_at DATETIME NULL,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX idx_news_status ON news(status);
    CREATE INDEX idx_news_published_at ON news(published_at DESC);
    CREATE INDEX idx_news_category ON news(category);
    
    PRINT 'Table news created successfully';
END
ELSE
BEGIN
    PRINT 'Table news already exists';
END
GO

-- Create user_read_announcements table (to track which users have read which announcements)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_read_announcements')
BEGIN
    CREATE TABLE user_read_announcements (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        announcement_id INT NOT NULL,
        read_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
        UNIQUE (user_id, announcement_id)
    );
    
    CREATE INDEX idx_user_read_announcements_user ON user_read_announcements(user_id);
    CREATE INDEX idx_user_read_announcements_announcement ON user_read_announcements(announcement_id);
    
    PRINT 'Table user_read_announcements created successfully';
END
ELSE
BEGIN
    PRINT 'Table user_read_announcements already exists';
END
GO

-- Insert sample announcements
IF NOT EXISTS (SELECT * FROM announcements WHERE title = 'Chào mừng đến với CLB Võ Cổ Truyền HUTECH')
BEGIN
    INSERT INTO announcements (title, content, type, priority, target_audience, status, created_by)
    VALUES 
    (
        N'Chào mừng đến với CLB Võ Cổ Truyền HUTECH',
        N'Chào mừng các bạn đã tham gia CLB Võ Cổ Truyền HUTECH! Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình rèn luyện võ thuật.',
        'general',
        'high',
        'all',
        'active',
        1
    ),
    (
        N'Lịch tập mới cho tháng này',
        N'Lịch tập mới đã được cập nhật. Vui lòng kiểm tra lịch tập của bạn trong mục "Lịch tập".',
        'info',
        'normal',
        'student',
        'active',
        1
    ),
    (
        N'Thông báo quan trọng về sự kiện sắp tới',
        N'Sự kiện giao lưu võ thuật sẽ được tổ chức vào cuối tháng. Đăng ký ngay để không bỏ lỡ!',
        'urgent',
        'urgent',
        'all',
        'active',
        1
    );
    
    PRINT 'Sample announcements inserted successfully';
END
GO

-- Insert sample news
IF NOT EXISTS (SELECT * FROM news WHERE title = 'CLB Võ Cổ Truyền HUTECH đạt giải Nhất tại giải võ thuật sinh viên')
BEGIN
    INSERT INTO news (title, content, excerpt, category, author_id, status, published_at, views)
    VALUES 
    (
        N'CLB Võ Cổ Truyền HUTECH đạt giải Nhất tại giải võ thuật sinh viên',
        N'Trong khuôn khổ giải võ thuật sinh viên TP.HCM năm 2026, CLB Võ Cổ Truyền HUTECH đã xuất sắc giành giải Nhất toàn đoàn với thành tích ấn tượng...',
        N'CLB Võ Cổ Truyền HUTECH đạt giải Nhất toàn đoàn tại giải võ thuật sinh viên TP.HCM 2026',
        'achievement',
        1,
        'published',
        GETDATE(),
        0
    ),
    (
        N'Khai giảng khóa học võ cổ truyền cho người mới bắt đầu',
        N'CLB Võ Cổ Truyền HUTECH thông báo khai giảng khóa học dành cho người mới bắt đầu. Khóa học sẽ bắt đầu từ ngày 1/3/2026...',
        N'Thông báo khai giảng khóa học võ cổ truyền cho người mới bắt đầu',
        'training',
        1,
        'published',
        GETDATE(),
        0
    );
    
    PRINT 'Sample news inserted successfully';
END
GO

PRINT 'Content tables migration completed successfully';
