# 📖 HƯỚNG DẪN SỬ DỤNG - CLB VÕ CỔ TRUYỀN HUTECH

## 🚀 KHỞI ĐỘNG NHANH

### Bước 1: Khởi động Server
```bash
cd backend
npm run dev
```

Server sẽ chạy tại: **http://localhost:3001**

### Bước 2: Kiểm tra Server
Mở trình duyệt và truy cập:
- API Docs: http://localhost:3001/api-docs
- Health Check: http://localhost:3001/health

---

## 🔐 ĐĂNG NHẬP

### Tài khoản mẫu:

**Admin:**
- Email: `admin@vocotruyenhutech.edu.vn`
- Password: `admin123456`

**Huấn luyện viên:**
- Email: `instructor@vocotruyenhutech.edu.vn`
- Password: `instructor123`

**Học viên:**
- Email: `student@vocotruyenhutech.edu.vn`
- Password: `student123`

---

## 📡 TEST API

### 1. Đăng nhập (Login)

**Request:**
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "admin@vocotruyenhutech.edu.vn",
  "password": "admin123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 2,
      "email": "admin@vocotruyenhutech.edu.vn",
      "username": "admin",
      "role": "admin",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-01-23T19:08:25.382Z"
  }
}
```

### 2. Lấy thông tin user hiện tại

**Request:**
```http
GET http://localhost:3001/api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "email": "admin@vocotruyenhutech.edu.vn",
      "username": "admin",
      "first_name": "Administrator",
      "role": "admin",
      ...
    }
  }
}
```

### 3. Đăng ký user mới

**Request:**
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "username": "newuser",
  "password": "password123",
  "first_name": "Nguyễn",
  "last_name": "Văn A",
  "phone_number": "0123456789"
}
```

### 4. Đổi mật khẩu

**Request:**
```http
PUT http://localhost:3001/api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "admin123456",
  "new_password": "newpassword123"
}
```

### 5. Đăng xuất

**Request:**
```http
POST http://localhost:3001/api/auth/logout
Authorization: Bearer {token}
```

---

## 🗄️ TRUY CẬP DATABASE

### Sử dụng sqlcmd:
```bash
sqlcmd -S localhost\SQLEXPRESS -U clb_admin -P "CLB@Hutech2026!"
```

### Các câu lệnh SQL hữu ích:

**Xem tất cả users:**
```sql
USE clb_vo_co_truyen_hutech;
SELECT id, email, username, role, is_active FROM users;
```

**Xem sessions đang hoạt động:**
```sql
SELECT id, user_id, ip_address, is_active, expires_at, created_at 
FROM user_sessions 
WHERE is_active = 1;
```

**Xem login attempts:**
```sql
SELECT TOP 10 email, ip_address, success, attempted_at 
FROM login_attempts 
ORDER BY attempted_at DESC;
```

**Tạo user mới:**
```sql
INSERT INTO users (email, username, password_hash, first_name, last_name, role, is_active)
VALUES ('test@example.com', 'testuser', '$2a$10$...', 'Test', 'User', 'student', 1);
```

---

## 🛠️ TROUBLESHOOTING

### Lỗi: Port 3001 đã được sử dụng

**Giải pháp 1: Kill process**
```bash
# Tìm PID
netstat -ano | findstr :3001

# Kill process
taskkill /F /PID <PID>
```

**Giải pháp 2: Đổi port**
Sửa file `backend/.env`:
```env
PORT=3002
```

### Lỗi: Không kết nối được database

**Kiểm tra SQL Server đang chạy:**
```bash
# Mở Services
services.msc

# Tìm "SQL Server (SQLEXPRESS)" và Start
```

**Test kết nối:**
```bash
sqlcmd -S localhost\SQLEXPRESS -U clb_admin -P "CLB@Hutech2026!" -Q "SELECT 1"
```

### Lỗi: Token không hợp lệ

**Nguyên nhân:**
- Token đã hết hạn (7 ngày)
- Token không đúng format
- Session đã bị revoke

**Giải pháp:**
- Đăng nhập lại để lấy token mới
- Hoặc dùng refresh token để làm mới

---

## 📚 CÁC ENDPOINT QUAN TRỌNG

### Authentication:
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/refresh` - Làm mới token
- `GET /api/auth/me` - Thông tin user hiện tại
- `PUT /api/auth/change-password` - Đổi mật khẩu
- `GET /api/auth/sessions` - Danh sách sessions
- `POST /api/auth/verify` - Verify token

### Users:
- `GET /api/users` - Danh sách users
- `GET /api/users/:id` - Chi tiết user
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Classes:
- `GET /api/classes` - Danh sách lớp học
- `POST /api/classes` - Tạo lớp mới
- `GET /api/classes/:id` - Chi tiết lớp
- `PUT /api/classes/:id` - Cập nhật lớp
- `DELETE /api/classes/:id` - Xóa lớp
- `POST /api/classes/:id/enroll` - Đăng ký lớp

### Events:
- `GET /api/events` - Danh sách sự kiện
- `POST /api/events` - Tạo sự kiện
- `GET /api/events/:id` - Chi tiết sự kiện
- `PUT /api/events/:id` - Cập nhật sự kiện
- `DELETE /api/events/:id` - Xóa sự kiện
- `POST /api/events/:id/register` - Đăng ký sự kiện

### Attendance:
- `GET /api/attendance` - Danh sách điểm danh
- `POST /api/attendance` - Điểm danh
- `GET /api/attendance/class/:classId` - Điểm danh theo lớp
- `GET /api/attendance/user/:userId` - Điểm danh theo user

### Notifications:
- `GET /api/notifications` - Danh sách thông báo
- `POST /api/notifications` - Tạo thông báo
- `PUT /api/notifications/:id/read` - Đánh dấu đã đọc
- `DELETE /api/notifications/:id` - Xóa thông báo

### Contact:
- `GET /api/contact` - Danh sách tin nhắn
- `POST /api/contact` - Gửi tin nhắn
- `GET /api/contact/:id` - Chi tiết tin nhắn
- `PUT /api/contact/:id/reply` - Trả lời tin nhắn

### Admin:
- `GET /api/admin/stats` - Thống kê hệ thống
- `GET /api/admin/users` - Quản lý users
- `GET /api/admin/audit-logs` - Audit logs
- `POST /api/admin/backup` - Backup database

---

## 🔒 PHÂN QUYỀN

### Roles:
- **admin**: Toàn quyền
- **instructor**: Quản lý lớp học, điểm danh
- **student**: Xem thông tin, đăng ký lớp/sự kiện
- **member**: Quyền cơ bản

### Ví dụ phân quyền:
```javascript
// Chỉ admin
router.get('/admin/stats', authenticate, authorize(['admin']), ...);

// Admin và instructor
router.post('/classes', authenticate, authorize(['admin', 'instructor']), ...);

// Tất cả user đã đăng nhập
router.get('/classes', authenticate, ...);

// Public (không cần đăng nhập)
router.get('/events', optionalAuth, ...);
```

---

## 📊 MONITORING

### Xem logs:
```bash
# Combined logs
tail -f backend/logs/combined.log

# Error logs only
tail -f backend/logs/error.log
```

### Kiểm tra scheduler:
Server log sẽ hiển thị:
```
🕐 Starting scheduler service...
   Scheduled: cleanExpiredSessions (0 * * * *)
   Scheduled: sendClassReminders (0 8 * * *)
   ...
✅ Scheduler service started with 8 jobs
```

### Kiểm tra WebSocket:
```javascript
const socket = io('http://localhost:3001');
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

---

## 🎯 NEXT STEPS

### 1. Phát triển Frontend:
- Tạo React/Vue/Angular app
- Kết nối với API backend
- Sử dụng token để authenticate

### 2. Thêm tính năng:
- Upload ảnh đại diện
- Gửi email thông báo
- Tích hợp payment gateway
- Xuất báo cáo Excel/PDF

### 3. Deploy Production:
- Sử dụng Docker
- Cấu hình Nginx
- Setup SSL certificate
- Cấu hình PM2

---

## 📞 HỖ TRỢ

### Documentation:
- `backend/README.md` - Tài liệu đầy đủ
- `backend/FEATURES.md` - Danh sách tính năng
- `SETUP_COMPLETE_100.md` - Báo cáo hoàn thành

### API Documentation:
- http://localhost:3001/api-docs

### Database:
- Server: localhost\SQLEXPRESS
- Database: clb_vo_co_truyen_hutech
- User: clb_admin
- Password: CLB@Hutech2026!

---

**🎉 CHÚC BẠN PHÁT TRIỂN DỰ ÁN THÀNH CÔNG! 🎉**
