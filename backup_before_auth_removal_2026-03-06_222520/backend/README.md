# CLB Võ Cổ Truyền HUTECH - Backend API

Backend API server cho hệ thống quản lý Câu lạc bộ Võ Cổ Truyền trường Đại học Công nghệ TP.HCM.

## 🚀 Tính năng

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Instructor, Student)
- Session management
- Password hashing với bcrypt
- Refresh token support

### User Management
- User registration và login
- Profile management
- Role và permission management
- User statistics và activity tracking

### Class Management
- Tạo và quản lý lớp học
- Enrollment system
- Instructor assignment
- Class scheduling

### Event Management
- Tạo và quản lý sự kiện
- Event registration
- Participant management
- Event types (tournament, demonstration, workshop, etc.)

### Attendance System
- Điểm danh học viên
- Attendance statistics
- Bulk attendance recording
- Attendance reports

### Notification System
- Real-time notifications
- Broadcast messaging
- Notification categories
- Read/unread status

### Contact Management
- Contact form submissions
- Admin response system
- Message status tracking

### Admin Dashboard
- System statistics
- User management
- Audit logs
- Data export
- System settings

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **Security**: helmet, cors, rate limiting
- **Logging**: morgan, custom logger service
- **Testing**: Jest, Supertest
- **Process Manager**: PM2
- **Containerization**: Docker, Docker Compose
- **Reverse Proxy**: Nginx
- **Scheduler**: node-cron
- **Cache**: In-memory cache service
- **API Documentation**: Swagger/OpenAPI
- **Environment**: dotenv

## 📦 Installation

### Prerequisites
- Node.js (v16 hoặc cao hơn)
- MySQL (v8.0 hoặc cao hơn)
- npm hoặc yarn

### Setup

1. **Clone repository và cài đặt dependencies**
```bash
cd backend
npm install
```

2. **Cấu hình environment variables**
```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clb_vo_co_truyen_hutech
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

3. **Khởi tạo database**
```bash
# Tạo database và tables
npm run init-db

# Hoặc chạy script trực tiếp
node scripts/init-db.js
```

4. **Chạy server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## 🔧 Scripts

```bash
npm start              # Chạy server production
npm run dev            # Chạy server development với nodemon
npm test               # Chạy tests với coverage
npm run test:watch     # Chạy tests trong watch mode
npm run test:unit      # Chạy unit tests
npm run test:integration # Chạy integration tests
npm run init-db        # Khởi tạo database
npm run migrate        # Chạy database migrations
npm run seed           # Seed dữ liệu mẫu
npm run pm2:start      # Start với PM2
npm run pm2:stop       # Stop PM2
npm run pm2:restart    # Restart PM2
npm run pm2:logs       # View PM2 logs
npm run docker:build   # Build Docker image
npm run docker:run     # Run với Docker Compose
npm run docker:stop    # Stop Docker containers
npm run docker:logs    # View Docker logs
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints
```
POST /api/auth/register     # Đăng ký tài khoản
POST /api/auth/login        # Đăng nhập
POST /api/auth/logout       # Đăng xuất
POST /api/auth/refresh      # Refresh token
GET  /api/auth/me          # Lấy thông tin user hiện tại
PUT  /api/auth/change-password # Đổi mật khẩu
```

### User Endpoints
```
GET  /api/users/:id         # Lấy thông tin user
PUT  /api/users/profile     # Cập nhật profile
GET  /api/users/profile/classes    # Lấy lớp học của user
GET  /api/users/profile/events     # Lấy sự kiện của user
GET  /api/users/profile/attendance # Lấy lịch sử điểm danh
```

### Class Endpoints
```
GET  /api/classes           # Lấy danh sách lớp học
GET  /api/classes/:id       # Lấy chi tiết lớp học
POST /api/classes/:id/enroll # Đăng ký lớp học
POST /api/classes           # Tạo lớp học (instructor/admin)
PUT  /api/classes/:id       # Cập nhật lớp học (instructor/admin)
```

### Event Endpoints
```
GET  /api/events            # Lấy danh sách sự kiện
GET  /api/events/:id        # Lấy chi tiết sự kiện
POST /api/events/:id/register # Đăng ký sự kiện
POST /api/events            # Tạo sự kiện (admin)
PUT  /api/events/:id        # Cập nhật sự kiện (admin)
```

### Attendance Endpoints
```
POST /api/attendance        # Ghi nhận điểm danh (instructor/admin)
GET  /api/attendance/class/:id # Lấy điểm danh theo lớp
POST /api/attendance/bulk   # Điểm danh hàng loạt
```

### Notification Endpoints
```
GET  /api/notifications     # Lấy thông báo
PUT  /api/notifications/:id/read # Đánh dấu đã đọc
POST /api/notifications     # Tạo thông báo (admin)
POST /api/notifications/broadcast # Gửi thông báo hàng loạt (admin)
```

### Contact Endpoints
```
POST /api/contact           # Gửi tin nhắn liên hệ
GET  /api/contact           # Lấy tin nhắn (admin)
POST /api/contact/:id/reply # Phản hồi tin nhắn (admin)
```

### Admin Endpoints
```
GET  /api/admin/dashboard   # Dashboard statistics
GET  /api/admin/users       # Quản lý users
PUT  /api/admin/users/:id   # Cập nhật user
GET  /api/admin/settings    # System settings
PUT  /api/admin/settings/:key # Cập nhật setting
GET  /api/admin/audit-logs  # Audit logs
GET  /api/admin/export/:type # Export dữ liệu
```

## 🔐 Authentication

API sử dụng JWT tokens cho authentication. Include token trong header:

```
Authorization: Bearer <your_jwt_token>
```

### Roles
- **admin**: Toàn quyền quản lý hệ thống
- **instructor**: Quản lý lớp học và điểm danh
- **student**: Đăng ký lớp học và sự kiện
- **member**: Quyền cơ bản

## 📊 Database Schema

### Main Tables
- `users` - Thông tin người dùng
- `classes` - Lớp học
- `events` - Sự kiện
- `class_enrollments` - Đăng ký lớp học
- `event_registrations` - Đăng ký sự kiện
- `attendance` - Điểm danh
- `notifications` - Thông báo
- `contact_messages` - Tin nhắn liên hệ
- `payments` - Thanh toán
- `audit_logs` - Nhật ký hoạt động

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Request validation
- **SQL Injection Protection**: Parameterized queries
- **Password Hashing**: bcrypt với salt rounds
- **JWT Security**: Secure token generation
- **Session Management**: Token expiration và refresh

## 📝 Logging

- **Morgan**: HTTP request logging
- **Audit Logs**: User activity tracking
- **Error Logging**: Comprehensive error tracking

## 🧪 Testing

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests trong watch mode
npm run test:watch

# Chạy unit tests
npm run test:unit

# Chạy integration tests
npm run test:integration
```

### Test Coverage

Backend có test coverage cho:
- Authentication routes
- Service layer (Cache, Analytics, Logger, Email)
- Error handling
- Health checks

Target coverage: 50% minimum

---

## 🚀 Deployment

Backend hỗ trợ nhiều phương thức deployment:

### 1. PM2 (Process Manager)

```bash
# Start with PM2
npm run pm2:start

# Monitor
pm2 monit

# Logs
npm run pm2:logs
```

### 2. Docker

```bash
# Build image
npm run docker:build

# Run with Docker Compose
npm run docker:run

# View logs
npm run docker:logs
```

### 3. Manual Deployment

```bash
# Install dependencies
npm ci --only=production

# Start server
NODE_ENV=production npm start
```

Xem chi tiết tại [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📈 Monitoring

- Health check endpoint: `GET /health`
- Detailed health: `GET /health/detailed`
- Readiness check: `GET /health/ready`
- Liveness check: `GET /health/live`
- Database connection monitoring
- Performance metrics
- Error tracking
- Cache statistics
- Scheduler job status

---

## 🔐 Security Features (Enhanced)

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting (configurable)
- **Input Validation**: Request validation with express-validator
- **SQL Injection Protection**: Parameterized queries
- **Password Hashing**: bcrypt với salt rounds
- **JWT Security**: Secure token generation and validation
- **Session Management**: Token expiration và refresh
- **Error Handling**: Centralized error handling
- **Logging**: Comprehensive audit logs
- **File Upload**: Secure file upload with size limits

---

## 📝 Advanced Features

### Scheduler Service
- Automated background jobs với node-cron
- Clean expired sessions
- Send class/event reminders
- Generate daily reports
- Database backup automation

### Cache Service
- In-memory caching với TTL
- Pattern-based cache operations
- Cache statistics và monitoring
- High-performance (1000 ops/ms)

### Analytics Service
- User analytics
- Class analytics
- Event analytics
- Real-time metrics tracking

### Logger Service
- Multi-level logging (error, warn, info, debug)
- File rotation
- Structured logging
- Performance tracking

---

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

- Email: dev@vocotruyenhutech.edu.vn
- Documentation: [API Docs](http://localhost:3000/api-docs)
- Deployment Guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

---

## 📚 Documentation

- [API Documentation](http://localhost:3000/api-docs) - Swagger UI
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Database Schema](./database/schema.sql) - Database structure
- [Changelog](./CHANGELOG.md) - Version history

---

**Phát triển bởi**: CLB Võ Cổ Truyền HUTECH  
**Version**: 1.0.0  
**Last Updated**: January 2026


---

## 🎉 All Features Completed

### ✅ Phase 1: Core Backend Setup
- Authentication & Authorization (JWT, RBAC)
- Database schema and migrations
- Basic API routes
- Security middleware

### ✅ Phase 2: Business Logic & Integrations
- Email service with templates
- File upload service
- Payment service (VNPay)
- Business logic implementation

### ✅ Phase 3: Advanced Features & Optimization
- Scheduler service (background jobs)
- Cache service (in-memory)
- Analytics service
- Logger service
- API documentation (Swagger)

### ✅ Phase 4: Testing, Documentation & Production Ready
- Unit & integration tests
- Error handling middleware
- Health check endpoints
- Docker & PM2 support
- Nginx configuration
- Production deployment guide

### ✅ Phase 5: Advanced Features & Integration
- WebSocket/Real-time features
- Two-Factor Authentication (2FA)
- Advanced security (IP whitelist, CSRF, rate limiting)
- Report generation (Excel, PDF)
- Third-party integrations (Google, Zalo, Facebook, SMS)
- API versioning (v1)
- Payment gateways (VNPay, MoMo)

---

## 📖 Additional Documentation

See [FEATURES.md](./FEATURES.md) for complete feature documentation.
