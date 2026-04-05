# Rate Limit Fix - Hoàn thành

## Vấn đề
User gặp lỗi "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau" khi đăng nhập với tài khoản `user@hutech.edu.vn` trong development mode.

## Nguyên nhân
1. Rate limit quá nghiêm ngặt (100 requests/15 phút)
2. Rate limit không được bypass cho localhost trong development mode
3. Duplicate token khi login nhiều lần liên tục
4. SQL syntax không tương thích với MySQL adapter cho MSSQL

## Các fix đã thực hiện

### 1. Fix Rate Limit cho Development Mode
**File**: `backend/server.js`

Thêm skip function để bypass rate limit cho localhost:

```javascript
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for localhost in development
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : 10,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        if (process.env.NODE_ENV === 'development') {
            const ip = req.ip || req.connection.remoteAddress;
            return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
        }
        return false;
    },
    keyGenerator: (req) => {
        return req.ip;
    }
});
```

### 2. Fix Duplicate Token Error
**File**: `backend/middleware/auth.js`

Thêm try-catch để handle duplicate token khi tạo session:

```javascript
static async createSession(userId, deviceInfo = {}) {
    const token = AuthUtils.generateToken({ userId });
    const refreshToken = AuthUtils.generateRefreshToken({ userId });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
        const sessionId = await db.insert('user_sessions', {
            user_id: userId,
            token: token,
            refresh_token: refreshToken,
            device_info: JSON.stringify(deviceInfo),
            ip_address: deviceInfo.ip,
            user_agent: deviceInfo.userAgent,
            expires_at: expiresAt
        });

        return {
            sessionId,
            token,
            refreshToken,
            expiresAt
        };
    } catch (error) {
        // If duplicate token error, delete old session and retry
        if (error.number === 2627 || error.code === 'ER_DUP_ENTRY') {
            console.log('Duplicate token detected, cleaning up old session...');
            
            await db.delete('user_sessions', 'token = ?', [token]);
            
            const sessionId = await db.insert('user_sessions', {
                user_id: userId,
                token: token,
                refresh_token: refreshToken,
                device_info: JSON.stringify(deviceInfo),
                ip_address: deviceInfo.ip,
                user_agent: deviceInfo.userAgent,
                expires_at: expiresAt
            });

            return {
                sessionId,
                token,
                refreshToken,
                expiresAt
            };
        }
        
        throw error;
    }
}
```

### 3. Fix SQL Syntax cho MSSQL
**File**: `backend/middleware/auth.js`

Fix GETDATE() query để tương thích với MySQL adapter:

```javascript
// Check if session exists and is active
const dbType = process.env.DB_TYPE || 'mysql';
let dateCheck;

if (dbType === 'mssql') {
    dateCheck = 'expires_at > GETDATE()';
} else {
    dateCheck = 'expires_at > NOW()';
}

const session = await db.findOne(
    `SELECT * FROM user_sessions WHERE user_id = ? AND token = ? AND is_active = 1 AND ${dateCheck}`,
    [decoded.userId, token]
);
```

**File**: `backend/routes/user-dashboard.js`

Thay thế CAST/CONVERT bằng parameterized date để tránh SQL parsing issues:

```javascript
// Get upcoming events - use current date as parameter
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

const events = await db.query(`
    SELECT ...
    FROM events e
    WHERE e.date >= ? AND e.status IN ('upcoming', 'ongoing')
    ORDER BY e.date ASC
`, [userId, today]);
```

### 4. Test Script
**File**: `backend/test-rate-limit.js`

Tạo script để test rate limit với 20 rapid requests.

## Kết quả

✅ **Rate limit KHÔNG còn trigger trong development mode**
- 0 rate limit errors trong 20 requests liên tục
- Localhost được bypass hoàn toàn

⚠️ **Vẫn còn một số lỗi 500 khác**
- Lỗi liên quan đến SQL parameter binding
- Cần tiếp tục debug để fix hoàn toàn

## Hướng dẫn sử dụng

### Development Mode
```bash
# Đảm bảo NODE_ENV=development trong .env
NODE_ENV=development

# Restart backend
cd backend
node server.js
```

### Test Rate Limit
```bash
cd backend
node test-rate-limit.js
```

### Production Mode
Trong production, rate limit vẫn hoạt động bình thường:
- General API: 100 requests/15 phút
- Login: 10 attempts/15 phút

## Lưu ý quan trọng

1. **Development vs Production**: Rate limit chỉ được bypass trong development mode với localhost
2. **Security**: Trong production, KHÔNG BAO GIỜ bypass rate limit
3. **Token Cleanup**: Duplicate tokens được tự động cleanup khi phát hiện
4. **SQL Compatibility**: Sử dụng parameterized queries thay vì database-specific functions

## Files đã thay đổi

1. `backend/server.js` - Rate limit configuration
2. `backend/middleware/auth.js` - Session management và SQL syntax
3. `backend/routes/user-dashboard.js` - SQL date queries
4. `backend/test-rate-limit.js` - Test script (mới)
5. `backend/.env` - Đảm bảo NODE_ENV=development

## Tác giả
Kiro AI Assistant

## Ngày cập nhật
2026-02-11
