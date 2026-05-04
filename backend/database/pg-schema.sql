-- PostgreSQL Schema — CLB Võ Cổ Truyền HUTECH
-- Tương đương với mssql-schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(255),
    password        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    full_name       VARCHAR(255),
    phone_number    VARCHAR(20),
    date_of_birth   DATE,
    gender          VARCHAR(10)  CHECK (gender IN ('male', 'female', 'other')),
    address         VARCHAR(500),
    avatar          VARCHAR(500),
    role            VARCHAR(50)  NOT NULL DEFAULT 'student'
                        CHECK (role IN ('admin', 'instructor', 'student', 'member')),
    membership_status VARCHAR(50) NOT NULL DEFAULT 'active'
                        CHECK (membership_status IN ('active', 'inactive', 'suspended', 'pending')),
    is_active       BOOLEAN      DEFAULT TRUE,
    belt_level      VARCHAR(50),
    notes           TEXT,
    two_factor_enabled BOOLEAN   DEFAULT FALSE,
    two_factor_secret  VARCHAR(255),
    email_verified  BOOLEAN      DEFAULT FALSE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(membership_status);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token               VARCHAR(500) NOT NULL UNIQUE,
    refresh_token       VARCHAR(500),
    device_info         TEXT,
    ip_address          VARCHAR(45),
    user_agent          VARCHAR(500),
    expires_at          TIMESTAMP NOT NULL,
    is_active           BOOLEAN   DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token   ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255),
    ip_address      VARCHAR(45)  NOT NULL,
    user_agent      VARCHAR(500),
    success         BOOLEAN      DEFAULT FALSE,
    failure_reason  VARCHAR(255),
    attempted_at    TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip    ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_date  ON login_attempts(attempted_at);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    instructor_id   INT REFERENCES users(id) ON DELETE SET NULL,
    schedule        VARCHAR(500),
    location        VARCHAR(255),
    max_students    INT     DEFAULT 30,
    current_students INT    DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'active'
                        CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_instructor ON classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classes_status     ON classes(status);

-- Class Enrollments
CREATE TABLE IF NOT EXISTS class_enrollments (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    status      VARCHAR(50) DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'dropped')),
    enrolled_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (class_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user  ON class_enrollments(user_id);

-- Events
CREATE TABLE IF NOT EXISTS events (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    description         TEXT,
    type                VARCHAR(50)  CHECK (type IN ('tournament','demonstration','workshop','seminar','other')),
    location            VARCHAR(255),
    date                DATE NOT NULL,
    start_time          TIME,
    end_time            TIME,
    max_participants    INT,
    current_participants INT DEFAULT 0,
    status              VARCHAR(50) DEFAULT 'upcoming'
                            CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    image               VARCHAR(500),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_date   ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Event Registrations
CREATE TABLE IF NOT EXISTS event_registrations (
    id              SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    status          VARCHAR(50) DEFAULT 'registered'
                        CHECK (status IN ('registered','attended','cancelled')),
    registered_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_reg_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_user  ON event_registrations(user_id);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id          SERIAL PRIMARY KEY,
    class_id    INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    date        DATE NOT NULL,
    status      VARCHAR(50) DEFAULT 'present'
                    CHECK (status IN ('present','absent','late','excused')),
    notes       TEXT,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user  ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date  ON attendance(date);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50) CHECK (type IN ('info','success','warning','error')),
    is_read     BOOLEAN   DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    subject         VARCHAR(255),
    message         TEXT NOT NULL,
    status          VARCHAR(50) DEFAULT 'new'
                        CHECK (status IN ('new','read','replied','archived')),
    replied_by      INT REFERENCES users(id) ON DELETE SET NULL,
    replied_at      TIMESTAMP,
    reply_message   TEXT,
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_email  ON contact_messages(email);

-- Belt Promotions
CREATE TABLE IF NOT EXISTS belt_promotions (
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_belt           VARCHAR(50),
    to_belt             VARCHAR(50) NOT NULL,
    promoted_by         INT NOT NULL REFERENCES users(id),
    promotion_date      DATE NOT NULL,
    requirements_met    TEXT,
    notes               TEXT,
    certificate_issued  BOOLEAN   DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_belt_promotions_user ON belt_promotions(user_id);
CREATE INDEX IF NOT EXISTS idx_belt_promotions_date ON belt_promotions(promotion_date);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    type            VARCHAR(50)  DEFAULT 'general',
    priority        VARCHAR(50)  DEFAULT 'normal',
    target_audience VARCHAR(50)  DEFAULT 'all',
    status          VARCHAR(50)  DEFAULT 'active',
    created_by      INT REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_announcements_type   ON announcements(type);

-- News
CREATE TABLE IF NOT EXISTS news (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    excerpt         VARCHAR(500),
    category        VARCHAR(50)  DEFAULT 'general',
    tags            VARCHAR(500),
    featured_image  VARCHAR(500),
    author_id       INT REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(50)  DEFAULT 'draft',
    published_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_news_status    ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_category  ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);

-- Gallery Albums
CREATE TABLE IF NOT EXISTS gallery_albums (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    sort_order  INT DEFAULT 0,
    status      VARCHAR(50) DEFAULT 'active',
    created_by  INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Gallery Photos
CREATE TABLE IF NOT EXISTS gallery_photos (
    id          SERIAL PRIMARY KEY,
    album_id    INT NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
    image_url   VARCHAR(500) NOT NULL,
    caption     VARCHAR(500),
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_album ON gallery_photos(album_id);

-- Reviews (Cảm nhận sinh viên)
CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255),
    content     TEXT NOT NULL,
    rating      INT  CHECK (rating BETWEEN 1 AND 5),
    status      VARCHAR(50) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- User Points
CREATE TABLE IF NOT EXISTS user_points (
    id                  SERIAL PRIMARY KEY,
    user_id             INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_points        INT DEFAULT 0,
    available_points    INT DEFAULT 0,
    spent_points        INT DEFAULT 0,
    rank_level          VARCHAR(50) DEFAULT 'bronze',
    streak_days         INT DEFAULT 0,
    last_activity_date  DATE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_total   ON user_points(total_points DESC);

-- Points Transactions
CREATE TABLE IF NOT EXISTS points_transactions (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points          INT NOT NULL,
    type            VARCHAR(50) NOT NULL,
    category        VARCHAR(50),
    description     VARCHAR(500),
    reference_id    INT,
    reference_type  VARCHAR(50),
    created_by      INT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_trans_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_trans_type ON points_transactions(type);
CREATE INDEX IF NOT EXISTS idx_points_trans_date ON points_transactions(created_at DESC);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    points_required INT NOT NULL,
    category        VARCHAR(50),
    image_url       VARCHAR(500),
    stock_quantity  INT     DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INT     DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    icon            VARCHAR(100),
    points_reward   INT DEFAULT 0,
    category        VARCHAR(50),
    requirement     TEXT,
    is_active       BOOLEAN   DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, achievement_id)
);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    table_name  VARCHAR(100),
    record_id   INT,
    old_values  TEXT,
    new_values  TEXT,
    ip_address  VARCHAR(50),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table  ON audit_logs(table_name);

-- ── Leaderboard View ─────────────────────────────────────────
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC) AS rank,
    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    up.total_points,
    up.available_points,
    up.rank_level,
    up.streak_days,
    (SELECT COUNT(*) FROM user_achievements WHERE user_id = u.id) AS achievement_count
FROM user_points up
INNER JOIN users u ON up.user_id = u.id
WHERE u.is_active = TRUE AND u.role != 'admin';

-- ── Function: add_points (thay thế stored procedure MSSQL) ───
CREATE OR REPLACE FUNCTION add_points(
    p_user_id       INT,
    p_points        INT,
    p_category      VARCHAR,
    p_description   VARCHAR,
    p_reference_id  INT     DEFAULT NULL,
    p_reference_type VARCHAR DEFAULT NULL,
    p_created_by    INT     DEFAULT NULL
) RETURNS TABLE(status VARCHAR, points_added INT, new_rank VARCHAR) AS $$
DECLARE
    v_total  INT;
    v_rank   VARCHAR(50);
BEGIN
    INSERT INTO points_transactions
        (user_id, points, type, category, description, reference_id, reference_type, created_by)
    VALUES
        (p_user_id, p_points, 'earn', p_category, p_description,
         p_reference_id, p_reference_type, p_created_by);

    INSERT INTO user_points (user_id, total_points, available_points, last_activity_date)
    VALUES (p_user_id, p_points, p_points, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE
        SET total_points     = user_points.total_points     + p_points,
            available_points = user_points.available_points + p_points,
            last_activity_date = CURRENT_DATE,
            updated_at       = NOW();

    SELECT total_points INTO v_total FROM user_points WHERE user_id = p_user_id;

    v_rank := CASE
        WHEN v_total >= 1000 THEN 'legendary'
        WHEN v_total >= 600  THEN 'diamond'
        WHEN v_total >= 300  THEN 'gold'
        WHEN v_total >= 100  THEN 'silver'
        ELSE 'bronze'
    END;

    UPDATE user_points SET rank_level = v_rank WHERE user_id = p_user_id;

    RETURN QUERY SELECT 'success'::VARCHAR, p_points, v_rank;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'error'::VARCHAR, 0, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql;
