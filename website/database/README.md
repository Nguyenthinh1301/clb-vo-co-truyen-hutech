# Database Documentation - CLB Võ Cổ Truyền HUTECH

## Tổng quan

Hệ thống database của CLB Võ Cổ Truyền HUTECH được thiết kế để quản lý toàn bộ hoạt động của câu lạc bộ, bao gồm quản lý người dùng, lớp học, sự kiện, thanh toán và hệ thống xác thực.

## Cấu trúc Files

### 1. `schema.sql`
Định nghĩa cấu trúc cơ sở dữ liệu với các bảng chính:

#### Bảng Users và Authentication
- **users**: Thông tin người dùng (học viên, huấn luyện viên, admin)
- **sessions**: Quản lý phiên đăng nhập
- **otp_codes**: Mã xác thực OTP
- **email_change_requests**: Yêu cầu thay đổi email
- **login_attempts**: Theo dõi số lần đăng nhập

#### Bảng Classes và Training
- **classes**: Thông tin lớp học
- **class_enrollments**: Ghi danh lớp học
- **attendance**: Điểm danh
- **belt_promotions**: Thăng cấp đai

#### Bảng Events và Activities
- **events**: Sự kiện, thi đấu, biểu diễn
- **event_registrations**: Đăng ký tham gia sự kiện

#### Bảng System Management
- **notifications**: Hệ thống thông báo
- **payments**: Quản lý thanh toán
- **system_settings**: Cấu hình hệ thống
- **audit_logs**: Ghi log hoạt động

### 2. `seed_data.sql`
Dữ liệu mẫu cho phát triển và kiểm thử:

#### Tài khoản mặc định
- **Admin**: admin@vocotruyenhutech.edu.vn / admin123456
- **Huấn luyện viên**: 3 thầy cô với các chuyên môn khác nhau
- **Học viên**: 8 sinh viên ở các cấp độ khác nhau

#### Dữ liệu mẫu
- 6 lớp học từ cơ bản đến nâng cao
- 5 sự kiện trong năm 2025
- Các thông báo và cấu hình hệ thống

### 3. `database_manager.js`
Class JavaScript quản lý dữ liệu trong localStorage:

### 4. `migration_manager.js`
Quản lý migration và backup database:

### 5. `test_suite.js`
Bộ test toàn diện cho hệ thống database:

### 6. `README.md`
Tài liệu hướng dẫn chi tiết:

#### Core Functions
```javascript
// Khởi tạo database
const db = new DatabaseManager();

// User management
db.createUser(userData);
db.getUserById(id);
db.updateUser(id, userData);
db.deleteUser(id);

// Authentication
db.authenticateUser(email, password);
db.createSession(userId, deviceInfo);
db.verifySession(token);

// Class management
db.createClass(classData);
db.enrollUserInClass(userId, classId);
db.recordAttendance(classId, userId, status);

// Event management
db.createEvent(eventData);
db.registerForEvent(userId, eventId);

// Notification system
db.createNotification(notificationData);
db.markNotificationAsRead(notificationId);
```

## Hướng dẫn sử dụng

### 1. Khởi tạo Database
```javascript
// Tự động khởi tạo khi tạo instance
const db = new DatabaseManager();

// Khởi tạo migration manager
const migrationManager = new DatabaseMigrationManager(db);

// Chạy migration nếu cần
if (migrationManager.needsMigration()) {
    await migrationManager.runMigrations();
}

// Hoặc reset và tạo lại dữ liệu mẫu
db.clearAllData();
db.initializeSampleData();
```

### 2. Quản lý User
```javascript
// Tạo user mới
const newUser = {
    email: 'student@hutech.edu.vn',
    password: 'password123',
    first_name: 'Nguyễn',
    last_name: 'Văn A',
    role: 'student'
};
const userId = db.createUser(newUser);

// Xác thực đăng nhập
const loginResult = db.authenticateUser('student@hutech.edu.vn', 'password123');
if (loginResult.success) {
    console.log('Đăng nhập thành công');
}
```

### 3. Quản lý Classes
```javascript
// Tạo lớp học mới
const newClass = {
    name: 'Võ Cơ Bản A1',
    instructor_id: instructorId,
    schedule: 'Thứ 2, 4, 6 - 18:00-19:30',
    max_students: 15,
    fee: 300000
};
const classId = db.createClass(newClass);

// Ghi danh học viên
db.enrollUserInClass(userId, classId);
```

### 4. System Settings
```javascript
// Lấy cấu hình
const siteName = db.getSystemSetting('site_name');

// Cập nhật cấu hình
db.setSystemSetting('max_students_per_class', 25);
```

### 5. Migration và Backup
```javascript
// Kiểm tra trạng thái migration
const status = migrationManager.getStatus();

// Tạo backup
const backupKey = migrationManager.createBackup();

// Restore từ backup
migrationManager.restoreFromBackup(backupKey);

// Kiểm tra tính toàn vẹn dữ liệu
const integrityCheck = migrationManager.checkIntegrity();

// Sửa chữa database
if (!integrityCheck.success) {
    await migrationManager.repairDatabase();
}
```

### 6. Testing
```javascript
// Chạy toàn bộ test
const testSuite = new DatabaseTestSuite();
await testSuite.runAllTests();

// Chạy test cụ thể
await testSuite.runTest('user');
await testSuite.runTest('auth');
await testSuite.runTest('performance');
```

## Database Schema Details

### Roles và Permissions
- **admin**: Quản lý toàn bộ hệ thống
- **instructor**: Quản lý lớp học, điểm danh, thăng cấp
- **student**: Xem thông tin, đăng ký lớp/sự kiện

### Belt Levels (Cấp đai)
- white (trắng)
- yellow (vàng)
- orange (cam)
- green (xanh lá)
- blue (xanh dương)
- brown (nâu)
- black (đen)

### Event Types
- tournament (thi đấu)
- demonstration (biểu diễn)
- workshop (workshop)
- seminar (hội thảo)
- social (giao lưu)

### Notification Types
- system (hệ thống)
- class (lớp học)
- event (sự kiện)
- promotion (thăng cấp)
- payment (thanh toán)

## Development Guidelines

### 1. Data Validation
- Luôn validate dữ liệu trước khi lưu
- Sử dụng các hàm helper có sẵn trong DatabaseManager

### 2. Error Handling
```javascript
try {
    const result = db.createUser(userData);
    if (!result.success) {
        console.error('Error:', result.error);
    }
} catch (error) {
    console.error('Database error:', error);
}
```

### 3. Performance
- Sử dụng index cho các truy vấn thường xuyên
- Limit kết quả khi cần thiết
- Cache dữ liệu static

### 4. Security
- Không lưu password dạng plain text trong production
- Validate và sanitize input
- Implement rate limiting cho authentication

## Migration và Backup

### Export Data
```javascript
// Xuất toàn bộ dữ liệu
const backupData = db.exportData();

// Xuất dữ liệu cụ thể
const userData = db.exportData(['users', 'classes']);
```

### Import Data
```javascript
// Nhập dữ liệu từ backup
db.importData(backupData);
```

### Clear Data
```javascript
// Xóa toàn bộ dữ liệu
db.clearAllData();

// Xóa dữ liệu cụ thể
db.clearData(['sessions', 'otp_codes']);
```

## Testing

### Sample Data
File `seed_data.sql` chứa dữ liệu mẫu để test:
- 1 admin, 3 instructors, 8 students
- 6 classes với các level khác nhau
- 5 events trong năm 2025
- Notifications và system settings

### Test Suite
File `test_suite.js` cung cấp bộ test toàn diện:

#### Available Tests
- **Database Initialization**: Kiểm tra khởi tạo database
- **User Management**: CRUD operations cho users
- **Authentication**: Hệ thống xác thực đăng nhập
- **Session Management**: Quản lý phiên đăng nhập
- **Class Management**: Quản lý lớp học và ghi danh
- **Event Management**: Quản lý sự kiện và đăng ký
- **Notification System**: Hệ thống thông báo
- **System Settings**: Cấu hình hệ thống
- **Data Integrity**: Tính toàn vẹn dữ liệu
- **Migration System**: Hệ thống migration
- **Performance Tests**: Kiểm tra hiệu suất
- **Security Tests**: Kiểm tra bảo mật

#### Running Tests
```javascript
// Chạy toàn bộ test
const testSuite = new DatabaseTestSuite();
await testSuite.runAllTests();

// Chạy test cụ thể
await testSuite.runTest('user');        // User management
await testSuite.runTest('auth');        // Authentication
await testSuite.runTest('session');     // Session management
await testSuite.runTest('class');       // Class management
await testSuite.runTest('event');       // Event management
await testSuite.runTest('notification'); // Notifications
await testSuite.runTest('performance'); // Performance tests
await testSuite.runTest('security');    // Security tests
```

### Test Scenarios
1. User registration và login
2. Class enrollment và attendance
3. Event registration
4. Belt promotion
5. Payment processing
6. Notification system

## Production Deployment

### 1. Database Setup
- Thay đổi từ localStorage sang database thực (MySQL/PostgreSQL)
- Implement connection pooling
- Setup backup schedule
- Setup migration system

### 2. Security
- Hash passwords với bcrypt
- Implement JWT for sessions
- Setup HTTPS
- Add rate limiting
- Validate và sanitize input

### 3. Performance
- Add database indexes
- Implement caching (Redis)
- Optimize queries
- Setup monitoring
- Load balancing

### 4. Migration từ Development
```javascript
// Export dữ liệu từ localStorage
const devData = db.exportData();

// Import vào production database
// (Cần implement adapter cho production DB)
```

### 5. Monitoring và Maintenance
```javascript
// Kiểm tra trạng thái hệ thống
const status = migrationManager.getStatus();

// Tạo backup định kỳ
setInterval(() => {
    migrationManager.createBackup();
    migrationManager.cleanupBackups(); // Giữ chỉ 5 backup gần nhất
}, 24 * 60 * 60 * 1000); // Hàng ngày

// Kiểm tra tính toàn vẹn dữ liệu
const integrity = migrationManager.checkIntegrity();
if (!integrity.success) {
    console.warn('Database integrity issues detected:', integrity.issues);
    // Send alert to admin
}
```

## Support

Liên hệ team phát triển để được hỗ trợ:
- Email: dev@vocotruyenhutech.edu.vn
- Documentation: Xem thêm tại `/docs/`
