# 🔧 SỬA LỖI ĐĂNG NHẬP - PASSWORD_HASH

## 🐛 VẤN ĐỀ PHÁT HIỆN

Database MSSQL sử dụng cột `password_hash` thay vì `password`, nhưng code đang dùng `password`.

## ✅ ĐÃ SỬA

### 1. Tạo Test Users
✅ Đã tạo 2 users test:
- `admin@test.com` / `admin123` (role: admin)
- `user@test.com` / `user123` (role: student)

### 2. Sửa Code Auth.js
✅ Đã thay đổi tất cả `password` → `password_hash`:

**Registration (dòng 48)**:
```javascript
// Trước
password: passwordHash,

// Sau  
password_hash: passwordHash,
```

**Login (dòng 147)**:
```javascript
// Trước
const isValidPassword = await AuthUtils.comparePassword(password, user.password);

// Sau
const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
```

**Remove password from response (dòng 184)**:
```javascript
// Trước
const { password: userPassword, ...userWithoutPassword } = user;

// Sau
const { password_hash: userPasswordHash, ...userWithoutPassword } = user;
```

**Change Password - Get (dòng 344)**:
```javascript
// Trước
const user = await db.findOne('SELECT password FROM users WHERE id = ?', [req.user.id]);

// Sau
const user = await db.findOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
```

**Change Password - Compare (dòng 347)**:
```javascript
// Trước
const isValidPassword = await AuthUtils.comparePassword(current_password, user.password);

// Sau
const isValidPassword = await AuthUtils.comparePassword(current_password, user.password_hash);
```

**Change Password - Update (dòng 358)**:
```javascript
// Trước
await db.update('users', { password: newPasswordHash }, 'id = ?', [req.user.id]);

// Sau
await db.update('users', { password_hash: newPasswordHash }, 'id = ?', [req.user.id]);
```

## 🔍 CẤU TRÚC DATABASE

### Users Table Columns:
```
- id (int)
- email (nvarchar)
- password_hash (nvarchar)  ← Đây là cột password
- full_name (nvarchar)
- phone_number (nvarchar)
- avatar (nvarchar)
- role (nvarchar)
- status (nvarchar)
- two_factor_enabled (bit)
- two_factor_secret (nvarchar)
- email_verified (bit)
- last_login_at (datetime)
- created_at (datetime)
- updated_at (datetime)
- first_name (nvarchar)
- last_name (nvarchar)
- date_of_birth (date)
- gender (nvarchar)
- address (nvarchar)
- profile_image (nvarchar)
- is_active (bit)
- belt_level (nvarchar)
- join_date (date)
- username (nvarchar)
- membership_status (nvarchar)
```

## 🧪 TEST

### Test Login API:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

### PowerShell:
```powershell
$body = @{
    email = "admin@test.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```

## 📝 TÀI KHOẢN TEST

### Admin:
- Email: `admin@test.com`
- Password: `admin123`
- Role: `admin`

### User:
- Email: `user@test.com`
- Password: `user123`
- Role: `student`

### Các tài khoản khác trong DB:
- `admin@vocotruyenhutech.edu.vn` (admin)
- `admin@hutech.edu.vn` (admin)
- `member@hutech.edu.vn` (student)
- `demo@test.com` (student)

## 🚀 KHỞI ĐỘNG LẠI BACKEND

Sau khi sửa code, cần restart backend:

```bash
# Stop backend (Ctrl+C)
# Start lại
cd backend
npm start
```

## ⚠️ LƯU Ý

Nếu vẫn gặp lỗi "Lỗi server khi đăng nhập", kiểm tra:

1. **Backend log** - Xem console backend để biết lỗi cụ thể
2. **Database connection** - Đảm bảo MSSQL đang chạy
3. **Column name** - Đảm bảo tất cả queries dùng `password_hash`

## 🔧 SCRIPTS HỮU ÍCH

### Kiểm tra users trong DB:
```bash
node backend/scripts/test-direct-query.js
```

### Tạo test users:
```bash
node backend/scripts/create-test-users.js
```

### Kiểm tra table structure:
```bash
node backend/scripts/check-users-table.js
```

---

*Đã sửa bởi Kiro AI - 2026-02-20*
