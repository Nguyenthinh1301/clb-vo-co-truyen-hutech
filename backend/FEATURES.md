# 🚀 CLB Võ Cổ Truyền HUTECH - Backend Features

Tài liệu tổng hợp tất cả tính năng của backend API.

---

## 📋 Mục lục

1. [Core Features](#core-features)
2. [Advanced Features](#advanced-features)
3. [Security Features](#security-features)
4. [Integration Features](#integration-features)
5. [Real-time Features](#real-time-features)
6. [Reporting & Analytics](#reporting--analytics)

---

## Core Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control (RBAC)**: Admin, Instructor, Student, Member roles
- **Session Management**: Token expiration and refresh mechanism
- **Password Security**: bcrypt hashing with salt rounds
- **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code
- **Backup Codes**: Emergency access codes for 2FA

### 👥 User Management
- User registration and login
- Profile management (update info, avatar)
- Role and permission management
- User statistics and activity tracking
- Password reset and change
- Email verification

### 📚 Class Management
- Create and manage martial arts classes
- Class scheduling and timetables
- Student enrollment system
- Instructor assignment
- Class capacity management
- Class status tracking (active, completed, cancelled)

### 🎯 Event Management
- Create and manage events (tournaments, demonstrations, workshops)
- Event registration system
- Participant management
- Event types and categories
- Event status tracking
- Event reminders

### ✅ Attendance System
- Student attendance tracking
- Bulk attendance recording
- Attendance statistics and reports
- Attendance status (present, absent, late, excused)
- Attendance history per student
- Class attendance rate calculation

### 🔔 Notification System
- Real-time notifications
- Broadcast messaging to all users
- Role-based notifications
- Notification categories
- Read/unread status tracking
- Push notifications support

### 💬 Contact Management
- Contact form submissions
- Admin response system
- Message status tracking
- Email notifications for responses

### 💰 Payment System
- Payment processing
- Multiple payment methods (VNPay, MoMo, Bank Transfer)
- Payment status tracking
- Payment history
- Invoice generation
- Refund management

---

## Advanced Features

### 🔌 WebSocket/Real-time Features
- **Real-time Communication**: Socket.IO integration
- **Live Notifications**: Instant notification delivery
- **Presence System**: Online/offline user status
- **Typing Indicators**: Real-time typing status
- **Room-based Broadcasting**: Class and event rooms
- **Connection Management**: Auto-reconnection and heartbeat

### 📊 Report Generation
- **User Activity Reports**: Detailed user engagement metrics
- **Class Performance Reports**: Attendance rates and statistics
- **Financial Reports**: Revenue, transactions, payment methods
- **Attendance Reports**: Per-class attendance analysis
- **Export Formats**: Excel (XLSX) and PDF
- **Dashboard Statistics**: Real-time system metrics

### 🗂️ File Management
- **File Upload**: Secure file upload with validation
- **Multiple File Types**: Images, documents, videos
- **File Size Limits**: Configurable size restrictions
- **Storage Management**: Organized file structure
- **Google Drive Integration**: Cloud backup option

### 📅 Scheduler Service
- **Background Jobs**: Automated task execution
- **Cron-based Scheduling**: Flexible scheduling patterns
- **Automated Tasks**:
  - Clean expired sessions
  - Send class reminders
  - Send event reminders
  - Clean expired notifications
  - Generate daily reports
  - Clean audit logs
  - Update membership status
  - Database backup

### 💾 Cache Service
- **In-memory Caching**: High-performance caching
- **TTL Support**: Time-to-live for cache entries
- **Pattern Matching**: Wildcard key operations
- **Cache Statistics**: Hit rate, memory usage
- **Cache Wrapper**: Function result caching
- **Increment/Decrement**: Atomic counter operations

### 📈 Analytics Service
- **User Analytics**: Registration trends, active users
- **Class Analytics**: Enrollment rates, popular classes
- **Event Analytics**: Registration trends, attendance
- **System Metrics**: Performance monitoring
- **Real-time Tracking**: Event-based analytics

---

## Security Features

### 🔒 Advanced Security
- **Two-Factor Authentication (2FA)**:
  - TOTP-based authentication
  - QR code generation
  - Backup codes
  - Token verification
  
- **IP Whitelist**: Restrict access by IP address
- **Request Signature**: HMAC-based request verification
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**:
  - Fixed window rate limiting
  - Sliding window rate limiting
  - Per-user rate limiting
  - Per-endpoint rate limiting
  
- **Security Audit**: Comprehensive security logging
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing control
- **Input Validation**: Request data validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization

---

## Integration Features

### 📅 Google Calendar
- Sync events to Google Calendar
- Automatic event creation
- Calendar reminders
- OAuth2 authentication

### 💬 Zalo OA (Official Account)
- Send messages to users
- Template-based notifications
- Broadcast messaging
- User engagement tracking

### 📘 Facebook Page
- Post updates to Facebook page
- Share events and news
- Image posting
- Engagement tracking

### 📱 SMS Service
- Send SMS notifications
- Class reminders via SMS
- Event notifications
- Emergency alerts

### 💳 Payment Gateways

**VNPay Integration**:
- Payment URL generation
- Signature verification
- Transaction tracking
- Refund support

**MoMo Integration**:
- QR code payment
- App-to-app payment
- Transaction verification
- Webhook handling

### ☁️ Google Drive
- File backup to Google Drive
- Document storage
- Shared folder management
- OAuth2 authentication

---

## Real-time Features

### 🔌 WebSocket Events

**Connection Events**:
- `connected`: User connected
- `disconnect`: User disconnected

**Notification Events**:
- `notification:new`: New notification received
- `notification:read`: Notification marked as read

**Class Events**:
- `class:update`: Class information updated
- `class:enroll`: New student enrolled
- `join:class`: Join class room
- `leave:class`: Leave class room

**Event Events**:
- `event:update`: Event information updated
- `event:register`: New participant registered
- `join:event`: Join event room
- `leave:event`: Leave event room

**Attendance Events**:
- `attendance:update`: Attendance recorded
- `attendance:bulk`: Bulk attendance update

**Presence Events**:
- `user:presence`: User online/offline status
- `user:typing`: User is typing
- `user:stopped-typing`: User stopped typing

---

## Reporting & Analytics

### 📊 Available Reports

1. **User Activity Report**
   - Total users
   - Enrolled classes per user
   - Registered events per user
   - Attendance count
   - Activity trends

2. **Class Performance Report**
   - Total classes
   - Enrollment statistics
   - Attendance rates
   - Class capacity utilization
   - Popular classes

3. **Financial Report**
   - Total revenue
   - Transactions by status
   - Payment methods breakdown
   - Revenue by type
   - Pending payments

4. **Attendance Report**
   - Attendance by class
   - Attendance by date range
   - Student attendance history
   - Attendance rate calculation
   - Late/absent statistics

5. **Dashboard Statistics**
   - Real-time user count
   - Active classes
   - Upcoming events
   - Monthly revenue
   - System health

### 📤 Export Options
- **Excel (XLSX)**: Formatted spreadsheets with styling
- **PDF**: Professional PDF reports
- **JSON**: Raw data export
- **CSV**: Comma-separated values

---

## API Versioning

### 📡 Version 1 (v1)
- Base path: `/api/v1`
- All current endpoints
- Backward compatible
- Stable API

### 🔄 Legacy Support
- Original paths: `/api/*`
- Redirects to v1
- Deprecated warnings
- Migration guide available

---

## Performance Optimization

### ⚡ Optimization Features
- **Database Connection Pooling**: Efficient connection management
- **Query Optimization**: Indexed queries and joins
- **Caching Strategy**: Multi-level caching
- **Compression**: Gzip response compression
- **Lazy Loading**: On-demand data loading
- **Pagination**: Efficient data pagination
- **Rate Limiting**: Prevent abuse and overload

---

## Monitoring & Logging

### 📝 Logging System
- **Multi-level Logging**: Error, Warn, Info, Debug
- **File Rotation**: Automatic log file rotation
- **Structured Logging**: JSON-formatted logs
- **Performance Logging**: Request/response timing
- **Error Tracking**: Comprehensive error logging
- **Audit Logging**: Security and user actions

### 💚 Health Checks
- **Basic Health**: `/health`
- **Detailed Health**: `/health/detailed`
- **Readiness Check**: `/health/ready`
- **Liveness Check**: `/health/live`
- **Database Status**: Connection and query health
- **Cache Status**: Cache performance metrics
- **System Metrics**: CPU, memory, uptime

---

## Deployment Support

### 🐳 Docker
- Multi-stage Dockerfile
- Docker Compose configuration
- MySQL container
- Redis container
- Nginx reverse proxy

### 🚀 PM2
- Cluster mode support
- Auto-restart on crash
- Load balancing
- Log management
- Monitoring dashboard

### 🌐 Nginx
- Reverse proxy configuration
- Rate limiting
- SSL/TLS support
- Gzip compression
- Security headers
- Static file serving

---

## Testing

### 🧪 Test Coverage
- Unit tests for services
- Integration tests for routes
- Authentication tests
- Database tests
- Mock data and fixtures
- Coverage reporting

### 📊 Test Statistics
- Target coverage: 50%+
- Automated testing
- CI/CD integration ready
- Test documentation

---

## Documentation

### 📚 Available Documentation
- **API Documentation**: Swagger/OpenAPI at `/api-docs`
- **README.md**: Getting started guide
- **DEPLOYMENT.md**: Production deployment guide
- **FEATURES.md**: This document
- **CHANGELOG.md**: Version history
- **Code Comments**: Inline documentation

---

## Environment Variables

### 🔧 Required Configuration

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clb_vo_co_truyen_hutech
DB_USER=your_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Zalo OA (Optional)
ZALO_ACCESS_TOKEN=your_access_token

# Facebook (Optional)
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_access_token

# Payment Gateways (Optional)
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key

# SMS (Optional)
SMS_PROVIDER_URL=your_sms_provider_url
SMS_API_KEY=your_api_key
SMS_SENDER_NAME=CLB Vo HUTECH
```

---

## 🎯 Feature Roadmap

### ✅ Completed (All 5 Phases)
- Phase 1: Core Backend Setup
- Phase 2: Business Logic & Integrations
- Phase 3: Advanced Features & Optimization
- Phase 4: Testing, Documentation & Production Ready
- Phase 5: Advanced Features & Integration

### 🔮 Future Enhancements
- Mobile app API optimization
- GraphQL API support
- Microservices architecture
- Advanced AI/ML features
- Video streaming support
- Multi-language support
- Advanced analytics dashboard

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Maintained by**: CLB Võ Cổ Truyền HUTECH Development Team
