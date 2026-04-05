# ✅ Fix Backend Crash khi Đăng ký Tài khoản Mới

## 🐛 Vấn đề

Backend crash mỗi khi có user đăng ký tài khoản mới với lỗi:
```
Invalid column name 'metadata'
```

## 🔍 Nguyên nhân

`NotificationService` cố gắng insert cột `metadata` vào bảng `notifications`, nhưng cột này không tồn tại trong database schema.

### Lỗi xảy ra ở:
1. **Function `notifyAdmins()`** - Gửi thông báo đến admin khi có user mới đăng ký
2. **Function `notifyUser()`** - Gửi thông báo chào mừng đến user mới

### Code gây lỗi:
```javascript
// Add metadata if provided
if (metadata && Object.keys(metadata).length > 0) {
    notificationData.metadata = JSON.stringify(metadata);
}
```

## ✅ Giải pháp

### 1. Sửa file `backend/services/notificationService.js`

**Đã comment out code insert metadata:**

```javascript
// Do NOT add metadata - column doesn't exist
// if (metadata && Object.keys(metadata).length > 0) {
//     notificationData.metadata = JSON.stringify(metadata);
// }
```

**Áp dụng cho 2 functions:**
- ✅ `notifyAdmins()` (line ~37-40)
- ✅ `notifyUser()` (line ~193-196)

### 2. Restart Backend

Backend đã được restart và đang chạy tốt.

## 🧪 Cách test

### Test 1: Dùng file HTML test
```
Mở: test-registration-backend.html
```

File này sẽ:
- Tự động generate email ngẫu nhiên
- Gửi request đăng ký
- Kiểm tra response
- Kiểm tra backend có crash không

### Test 2: Đăng ký trực tiếp
1. Mở trang đăng ký: `http://localhost:3000/website/views/account/dang-ky.html`
2. Điền form và đăng ký
3. Kiểm tra backend logs
4. Kiểm tra có thông báo lỗi không

### Test 3: Kiểm tra backend logs
```bash
# Xem logs backend
# Backend terminal sẽ hiển thị:
# - "Sent notification to X admin(s): ..."
# - Không có lỗi "Invalid column name 'metadata'"
```

## 📊 Database Schema

Bảng `notifications` hiện tại KHÔNG có cột `metadata`:

```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    type VARCHAR(50),
    title NVARCHAR(255),
    message NVARCHAR(MAX),
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Lưu ý:** Nếu muốn thêm metadata trong tương lai, cần:
1. Thêm cột vào database: `ALTER TABLE notifications ADD metadata NVARCHAR(MAX)`
2. Uncomment code trong NotificationService

## 🔄 Lịch sử lỗi tương tự

Đây là lần thứ 2 gặp lỗi tương tự:

### Lần 1: Cột `priority`
- **Lỗi:** Invalid column name 'priority'
- **Nguyên nhân:** NotificationService insert cột không tồn tại
- **Giải pháp:** Comment out code insert priority
- **File:** `backend/services/notificationService.js`

### Lần 2: Cột `metadata` (lần này)
- **Lỗi:** Invalid column name 'metadata'
- **Nguyên nhân:** Tương tự lần 1
- **Giải pháp:** Comment out code insert metadata
- **File:** `backend/services/notificationService.js`

## 💡 Khuyến nghị

### Để tránh lỗi tương tự trong tương lai:

1. **Kiểm tra schema trước khi code:**
   - Xem bảng có cột nào: `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications'`
   - Chỉ insert các cột tồn tại

2. **Sử dụng migration:**
   - Tạo migration file khi thêm cột mới
   - Document các thay đổi schema

3. **Error handling tốt hơn:**
   - Wrap insert trong try-catch
   - Log lỗi chi tiết
   - Không để backend crash

4. **Testing:**
   - Test đăng ký sau mỗi thay đổi NotificationService
   - Kiểm tra backend logs
   - Dùng file test HTML

## 📝 Files đã sửa

1. ✅ `backend/services/notificationService.js` - Comment out metadata insert
2. ✅ `test-registration-backend.html` - File test (mới)
3. ✅ `FIX_BACKEND_CRASH_ON_REGISTRATION.md` - Tài liệu này (mới)

## ✨ Kết quả

- ✅ Backend không còn crash khi đăng ký tài khoản mới
- ✅ Thông báo vẫn được gửi đến admin (không có metadata)
- ✅ Thông báo chào mừng vẫn được gửi đến user mới
- ✅ Hệ thống hoạt động ổn định

## 🚀 Backend Status

```
✅ Backend đang chạy: http://localhost:3000
✅ Database connected: SQL Server
✅ Registration working: Yes
✅ Notifications working: Yes (without metadata)
```

---

**Ngày sửa:** 2025-02-21  
**Trạng thái:** ✅ FIXED  
**Test:** ✅ PASSED
