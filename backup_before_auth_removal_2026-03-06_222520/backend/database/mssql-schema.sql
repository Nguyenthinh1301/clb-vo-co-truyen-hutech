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

-- Sessions table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sessions')
BEGIN
    CREATE TABLE sessions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        token NVARCHAR(500) NOT NULL UNIQUE,
        refresh_token NVARCHAR(500),
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_sessions_token ON sessions(token);
    CREATE INDEX idx_sessions_user_id ON sessions(user_id);
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
        reply NVARCHAR(MAX),
        replied_at DATETIME,
        created_at DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX idx_contact_status ON contact_messages(status);
    CREATE INDEX idx_contact_email ON contact_messages(email);
END
GO

-- Payments table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payments')
BEGIN
    CREATE TABLE payments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type NVARCHAR(50) CHECK (type IN ('membership', 'class', 'event', 'other')),
        status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        payment_method NVARCHAR(50) CHECK (payment_method IN ('vnpay', 'momo', 'bank_transfer', 'cash')),
        transaction_id NVARCHAR(255),
        description NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX idx_payments_user ON payments(user_id);
    CREATE INDEX idx_payments_status ON payments(status);
    CREATE INDEX idx_payments_transaction ON payments(transaction_id);
END
GO

-- Audit logs table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        action NVARCHAR(255) NOT NULL,
        table_name NVARCHAR(100),
        record_id INT,
        old_values NVARCHAR(MAX),
        new_values NVARCHAR(MAX),
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX idx_audit_user ON audit_logs(user_id);
    CREATE INDEX idx_audit_action ON audit_logs(action);
    CREATE INDEX idx_audit_date ON audit_logs(created_at);
END
GO

PRINT 'Database schema created successfully!';
