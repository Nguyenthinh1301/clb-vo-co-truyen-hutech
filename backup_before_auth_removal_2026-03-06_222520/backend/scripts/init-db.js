const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    let connection;
    
    try {
        console.log('🔄 Initializing database...');
        
        // Connect to MySQL server (without database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });
        
        console.log('✅ Connected to MySQL server');
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        console.log('🔄 Creating database and tables...');
        await connection.execute(schema);
        console.log('✅ Database schema created successfully');
        
        // Seed initial data
        await seedInitialData(connection);
        
        console.log('🎉 Database initialization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function seedInitialData(connection) {
    console.log('🔄 Seeding initial data...');
    
    // Use the created database
    await connection.execute(`USE ${process.env.DB_NAME || 'clb_vo_co_truyen_hutech'}`);
    
    const bcrypt = require('bcryptjs');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123456', 12);
    await connection.execute(`
        INSERT INTO users (
            email, username, password_hash, first_name, last_name, 
            role, membership_status, belt_level, email_verified, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        'admin@vocotruyenhutech.edu.vn',
        'admin',
        adminPassword,
        'Admin',
        'CLB Võ Cổ Truyền',
        'admin',
        'active',
        'black',
        1,
        1
    ]);
    
    // Create sample instructor
    const instructorPassword = await bcrypt.hash('instructor123', 12);
    await connection.execute(`
        INSERT INTO users (
            email, username, password_hash, first_name, last_name, 
            phone_number, role, membership_status, belt_level, email_verified, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        'instructor@vocotruyenhutech.edu.vn',
        'instructor1',
        instructorPassword,
        'Nguyễn',
        'Văn Thầy',
        '0909123456',
        'instructor',
        'active',
        'black',
        1,
        1
    ]);
    
    // Create sample students
    const studentPassword = await bcrypt.hash('student123', 12);
    const students = [
        ['student1@hutech.edu.vn', 'student1', 'Trần', 'Văn A', '0909234567'],
        ['student2@hutech.edu.vn', 'student2', 'Lê', 'Thị B', '0909345678'],
        ['student3@hutech.edu.vn', 'student3', 'Phạm', 'Văn C', '0909456789']
    ];
    
    for (const [email, username, firstName, lastName, phone] of students) {
        await connection.execute(`
            INSERT INTO users (
                email, username, password_hash, first_name, last_name, 
                phone_number, role, membership_status, belt_level, email_verified, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            email, username, studentPassword, firstName, lastName, phone,
            'student', 'active', 'white', 1, 1
        ]);
    }
    
    // Create sample classes
    const classes = [
        ['Võ Cơ Bản A1', 'Lớp học dành cho người mới bắt đầu', 'beginner', 'Thứ 2, 4, 6 - 18:00-19:30', '2025-02-01', 15, 300000],
        ['Võ Trung Cấp B1', 'Lớp học dành cho học viên có kinh nghiệm', 'intermediate', 'Thứ 3, 5, 7 - 18:00-19:30', '2025-02-01', 12, 400000],
        ['Võ Nâng Cao C1', 'Lớp học dành cho học viên nâng cao', 'advanced', 'Thứ 2, 4, 6 - 19:30-21:00', '2025-02-01', 10, 500000]
    ];
    
    for (const [name, description, level, schedule, startDate, maxStudents, fee] of classes) {
        await connection.execute(`
            INSERT INTO classes (
                name, description, instructor_id, level, schedule, 
                start_date, max_students, fee, location, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name, description, 2, level, schedule, startDate, maxStudents, fee,
            'Phòng tập CLB Võ Cổ Truyền', 'active'
        ]);
    }
    
    // Create sample events
    const events = [
        ['Giải Thi Đấu Võ Cổ Truyền 2025', 'Giải thi đấu thường niên của CLB', 'tournament', '2025-03-15', '08:00:00', '17:00:00', 50, 100000],
        ['Biểu Diễn Võ Thuật', 'Buổi biểu diễn võ thuật truyền thống', 'demonstration', '2025-04-20', '14:00:00', '16:00:00', 100, 0],
        ['Workshop Võ Cổ Truyền', 'Workshop học hỏi kỹ thuật mới', 'workshop', '2025-05-10', '09:00:00', '12:00:00', 30, 200000]
    ];
    
    for (const [title, description, type, startDate, startTime, endTime, maxParticipants, fee] of events) {
        await connection.execute(`
            INSERT INTO events (
                title, description, type, start_date, start_time, end_time,
                max_participants, registration_fee, organizer_id, status, is_public
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, description, type, startDate, startTime, endTime,
            maxParticipants, fee, 1, 'scheduled', 1
        ]);
    }
    
    // Create welcome notification
    await connection.execute(`
        INSERT INTO notifications (
            user_id, title, message, type, priority
        ) VALUES (?, ?, ?, ?, ?)
    `, [
        null,
        'Chào mừng đến với CLB Võ Cổ Truyền HUTECH',
        'Hệ thống quản lý CLB đã được khởi tạo thành công. Chúc các bạn có những trải nghiệm tuyệt vời!',
        'system',
        'medium'
    ]);
    
    console.log('✅ Initial data seeded successfully');
    console.log('\n📋 Default accounts created:');
    console.log('👤 Admin: admin@vocotruyenhutech.edu.vn / admin123456');
    console.log('👨‍🏫 Instructor: instructor@vocotruyenhutech.edu.vn / instructor123');
    console.log('👨‍🎓 Students: student1@hutech.edu.vn / student123 (and student2, student3)');
}

// Run initialization
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };