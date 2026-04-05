# API Documentation - CLB Võ Cổ Truyền HUTECH

## Tổng quan

Hệ thống API cho website CLB Võ Cổ Truyền HUTECH cung cấp các endpoint để quản lý người dùng, xác thực, và các chức năng của câu lạc bộ.

## Base URL

```
Production: https://api.clbvocotruyen-hutech.com/v1
Development: http://localhost:3000/api/v1
```

## Authentication

Hệ thống sử dụng JWT (JSON Web Token) để xác thực. Token phải được gửi trong header Authorization:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

Tất cả response đều có format JSON chuẩn:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error_code": 400,
  "errors": {
    // Validation errors if any
  },
  "timestamp": "2024-12-27T10:00:00Z"
}
```

## Endpoints

### 1. Authentication

#### POST /auth/login
Đăng nhập người dùng

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "123",
      "email": "user@example.com",
      "name": "Nguyễn Văn A",
      "role": "student",
      "profile": {
        // User profile data
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/register
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Nguyễn Văn B",
  "profile": {
    "firstName": "Nguyễn",
    "lastName": "Văn B",
    "phone": "0123456789",
    "birthDate": "1995-01-01",
    "gender": "male",
    "experience": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "124",
      "email": "newuser@example.com",
      "name": "Nguyễn Văn B",
      "role": "member",
      "profile": {
        // User profile data
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/social-login
Đăng nhập bằng Google/Facebook

**Request Body:**
```json
{
  "provider": "google", // hoặc "facebook"
  "token": "google_or_facebook_token",
  "userData": {
    "id": "google_or_facebook_id",
    "email": "user@gmail.com",
    "name": "User Name",
    "picture": "https://profile-picture-url"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "125",
      "email": "user@gmail.com",
      "name": "User Name",
      "role": "member",
      "loginMethod": "google",
      "profile": {
        "picture": "https://profile-picture-url",
        "socialId": "google_or_facebook_id"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/social-register
Đăng ký bằng Google/Facebook

**Request Body:**
```json
{
  "provider": "google", // hoặc "facebook"
  "token": "google_or_facebook_token",
  "userData": {
    "id": "google_or_facebook_id",
    "email": "user@gmail.com",
    "name": "User Name",
    "firstName": "User",
    "lastName": "Name",
    "picture": "https://profile-picture-url"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "126",
      "email": "user@gmail.com",
      "name": "User Name",
      "role": "member",
      "signupMethod": "google",
      "profile": {
        "firstName": "User",
        "lastName": "Name",
        "picture": "https://profile-picture-url",
        "socialId": "google_or_facebook_id"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
    "gender": "male"
  }
}
```

#### POST /auth/logout
Đăng xuất người dùng

**Headers:** Authorization required

#### POST /auth/change-password
Đổi mật khẩu

**Headers:** Authorization required

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123"
}
```

### 2. Social Authentication

#### POST /auth/google
Đăng nhập bằng Google

**Request Body:**
```json
{
  "token": "google_oauth_token"
}
```

#### POST /auth/facebook
Đăng nhập bằng Facebook

**Request Body:**
```json
{
  "token": "facebook_access_token"
}
```

### 3. User Management

#### GET /users/profile
Lấy thông tin profile người dùng hiện tại

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "role": "student",
    "profile": {
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "phone": "0123456789",
      "birthDate": "1995-01-01",
      "gender": "male",
      "avatar": "/uploads/avatars/123.jpg",
      "membershipStatus": "active",
      "joinDate": "2024-01-01"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /users/profile
Cập nhật thông tin profile

**Headers:** Authorization required

**Request Body:**
```json
{
  "profile": {
    "firstName": "Nguyễn",
    "lastName": "Văn A Updated",
    "phone": "0987654321",
    "address": "123 Đường ABC, Quận XYZ"
  }
}
```

#### GET /users
Lấy danh sách người dùng (Admin only)

**Headers:** Authorization required (Admin role)

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số items per page (default: 10)
- `role`: Filter theo role
- `status`: Filter theo status

### 4. Club Management

#### GET /club/members
Lấy danh sách thành viên

**Query Parameters:**
- `page`: Số trang
- `limit`: Số items per page

#### GET /club/training-schedule
Lấy lịch tập luyện

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "day": "monday",
      "time": "19:00-21:00",
      "activity": "Võ cổ truyền cơ bản",
      "location": "Phòng tập A1",
      "instructor": "Thầy Minh"
    }
  ]
}
```

#### GET /club/activities
Lấy danh sách hoạt động

#### GET /club/events
Lấy danh sách sự kiện

#### GET /club/announcements
Lấy danh sách thông báo

### 5. File Upload

#### POST /upload/avatar
Upload avatar

**Headers:** Authorization required

**Form Data:**
- `file`: Image file
- `category`: "avatar"

**Response:**
```json
{
  "success": true,
  "message": "Upload thành công",
  "data": {
    "url": "/uploads/avatars/123.jpg",
    "filename": "avatar.jpg",
    "size": 1024000
  }
}
```

#### POST /upload/image
Upload hình ảnh

#### POST /upload/document
Upload tài liệu

### 6. Admin

#### GET /admin/dashboard-stats
Lấy thống kê dashboard (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalActivities": 25,
    "totalEvents": 5
  }
}
```

#### GET /admin/activity-logs
Lấy log hoạt động (Admin only)

#### GET /admin/settings
Lấy cài đặt hệ thống (Admin only)

#### PUT /admin/settings
Cập nhật cài đặt hệ thống (Admin only)

## Error Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## Rate Limiting

- **Authentication endpoints**: 5 requests/minute
- **General endpoints**: 100 requests/minute
- **Upload endpoints**: 10 requests/minute

## OAuth Configuration

### Google OAuth 2.0

1. Tạo project tại [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Sign-In API
3. Tạo OAuth 2.0 credentials
4. Thêm authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### Facebook Login

1. Tạo app tại [Facebook Developers](https://developers.facebook.com/)
2. Enable Facebook Login product
3. Thêm Valid OAuth Redirect URIs:
   - `http://localhost:3000/auth/facebook/callback` (development)
   - `https://yourdomain.com/auth/facebook/callback` (production)

## Testing

### Demo Accounts

```
Admin:
- Email: admin@hutech.edu.vn
- Password: admin123

Instructor:
- Email: instructor@hutech.edu.vn
- Password: instructor123

Student:
- Email: student@hutech.edu.vn
- Password: student123
```

### Postman Collection

Import file `CLB_VoCo_API.postman_collection.json` để test các endpoints.

## Security

- Tất cả passwords được hash bằng bcrypt
- JWT tokens có thời gian expire 24h
- CORS được configure cho các domain được phép
- Rate limiting để tránh abuse
- Input validation và sanitization
- HTTPS required cho production

## Deployment

### Environment Variables

```env
NODE_ENV=production
PORT=3000
DB_CONNECTION_STRING=mongodb://localhost:27017/clb-voco
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Support

Để được hỗ trợ, vui lòng liên hệ:
- Email: support@clbvocotruyen-hutech.com
- GitHub Issues: [Repository Issues](https://github.com/clb-voco-hutech/api/issues)
