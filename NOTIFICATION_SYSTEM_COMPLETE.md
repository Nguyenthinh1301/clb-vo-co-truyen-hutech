# Hệ thống Thông báo - Hoàn thiện

## Tổng quan
Hệ thống thông báo cho phép Admin gửi thông báo đến thành viên và nhận thông báo tự động từ hệ thống.

## Tính năng

### 1. Thông báo nhận được (Admin)
Admin nhận thông báo tự động khi:
- Có thành viên mới đăng ký
- Có hoạt động quan trọng trong hệ thống

**Hiển thị:**
- Danh sách thông báo với trạng thái đã đọc/chưa đọc
- Badge "Mới" cho thông báo chưa đọc
- Số lượng thông báo chưa đọc ở header
- Nút đánh dấu đã đọc từng thông báo
- Nút đánh dấu đã đọc tất cả

### 2. Gửi thông báo (Admin)
Admin có thể gửi thông báo đến:
- **Tất cả thành viên**: Gửi đến tất cả user (trừ admin)
- **Theo vai trò**: Gửi đến học viên hoặc huấn luyện viên
- **Chọn cụ thể**: Chọn nhiều thành viên từ danh sách

**Loại thông báo:**
- 🔵 Thông tin (info) - Màu xanh dương
- ✅ Thành công (success) - Màu xanh lá
- ⚠️ Cảnh báo (warning) - Màu vàng
- 🔴 Khẩn cấp (error) - Màu đỏ

### 3. Lịch sử gửi thông báo
Hiển thị:
- Thời gian gửi
- Tiêu đề thông báo
- Loại thông báo
- Số lượng người nhận
- Trạng thái (Đã gửi)

## Cấu trúc Database

### Bảng `notifications`
```sql
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    type NVARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Lưu ý:** Cột `type` chỉ chấp nhận 4 giá trị: `info`, `success`, `warning`, `error`

## Backend API

### 1. Gửi thông báo
```
POST /api/admin/notifications/send
Authorization: Bearer <token>
Role: admin

Body:
{
  "recipients": [28, 29, 27],  // Array of user IDs
  "type": "info",               // info, success, warning, error
  "title": "Tiêu đề",
  "message": "Nội dung thông báo"
}

Response:
{
  "success": true,
  "message": "Đã gửi thông báo đến 3 người",
  "data": {
    "recipientCount": 3
  }
}
```

### 2. Lấy lịch sử gửi thông báo
```
GET /api/admin/notifications/history?limit=20
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "data": [
    {
      "id": 10,
      "type": "info",
      "title": "🎉 Thành viên mới đăng ký",
      "message": "...",
      "created_at": "2026-02-21T19:55:03.000Z",
      "recipient_count": 1
    }
  ]
}
```

### 3. Lấy thông báo của user hiện tại
```
GET /api/notifications/my-notifications?limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 10,
      "user_id": 25,
      "type": "info",
      "title": "🎉 Thành viên mới đăng ký",
      "message": "...",
      "is_read": 0,
      "created_at": "2026-02-21T19:55:03.000Z"
    }
  ]
}
```

### 4. Đánh dấu thông báo đã đọc
```
PATCH /api/notifications/:id/read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Đã đánh dấu thông báo là đã đọc"
}
```

### 5. Đánh dấu tất cả đã đọc
```
PATCH /api/notifications/mark-all-read
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Đã đánh dấu tất cả thông báo là đã đọc"
}
```

### 6. Lấy số lượng thông báo chưa đọc
```
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "unreadCount": 3
  }
}
```

## Frontend Components

### 1. Dashboard Admin - Tab Thông báo
**File:** `dashboard/js/dashboard-notifications.js`

**Sections:**
1. **Thông báo nhận được** - Hiển thị thông báo mà admin nhận được
2. **Gửi thông báo đến thành viên** - Form gửi thông báo
3. **Lịch sử gửi thông báo** - Bảng lịch sử

**Functions:**
- `init()` - Khởi tạo module
- `loadReceivedNotifications()` - Load thông báo nhận được
- `markAsRead(id)` - Đánh dấu đã đọc
- `markAllAsRead()` - Đánh dấu tất cả đã đọc
- `updateNotificationCount()` - Cập nhật số badge
- `sendNotification()` - Gửi thông báo
- `loadNotificationHistory()` - Load lịch sử

### 2. User Dashboard - Tab Thông báo
**File:** `dashboard/js/user-dashboard.js`

User cũng có tab thông báo để xem thông báo từ admin.

## Thông báo tự động

### NotificationService
**File:** `backend/services/notificationService.js`

**Functions:**
- `notifyAdmins()` - Gửi thông báo đến tất cả admin
- `notifyNewUserRegistration()` - Thông báo khi có user mới
- `notifyClassEnrollment()` - Thông báo khi user đăng ký lớp
- `notifyEventRegistration()` - Thông báo khi user đăng ký sự kiện
- `notifyNewContact()` - Thông báo khi có liên hệ mới
- `notifyUser()` - Gửi thông báo đến user cụ thể
- `sendWelcomeNotification()` - Gửi thông báo chào mừng
- `notifyClassAssignment()` - Thông báo khi được phân lớp

**Validation Type:**
Service tự động convert các type không hợp lệ:
```javascript
const typeMap = {
    'system': 'info',
    'class': 'info',
    'event': 'info',
    'general': 'info'
};
```

## Cách sử dụng

### Admin gửi thông báo:
1. Đăng nhập Dashboard Admin
2. Vào tab "Thông báo"
3. Cuộn xuống phần "Gửi thông báo đến thành viên"
4. Chọn người nhận (tất cả/theo vai trò/chọn cụ thể)
5. Chọn loại thông báo
6. Nhập tiêu đề và nội dung
7. Click "Gửi thông báo"

### Admin xem thông báo nhận được:
1. Đăng nhập Dashboard Admin
2. Vào tab "Thông báo"
3. Xem phần "Thông báo nhận được" ở đầu trang
4. Click vào thông báo hoặc nút "Đánh dấu đã đọc"

### User xem thông báo:
1. Đăng nhập User Dashboard
2. Vào tab "Thông báo"
3. Xem danh sách thông báo
4. Click để đánh dấu đã đọc

## Dữ liệu mẫu

### Thông báo đã tạo cho Admin:
```
1. Notification ID: 10
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Message: Huỳnh Thị Kim Nga vừa đăng ký tài khoản mới...
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03

2. Notification ID: 9
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Message: Bùi Phạm Xuân Giang vừa đăng ký tài khoản mới...
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03

3. Notification ID: 8
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Message: Quoc An vừa đăng ký tài khoản mới...
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03
```

## Files đã cập nhật

### Backend:
1. `backend/routes/admin-notifications.js` - API routes cho admin
2. `backend/routes/notifications.js` - API routes cho user
3. `backend/services/notificationService.js` - Service gửi thông báo tự động

### Frontend:
1. `dashboard/js/dashboard-notifications.js` - Module quản lý thông báo admin
2. `dashboard/js/user-dashboard.js` - Module thông báo user
3. `dashboard/dashboard.html` - Dashboard admin HTML

### Scripts:
1. `backend/scripts/check-users-and-notifications.js` - Kiểm tra database
2. `backend/scripts/create-test-notification.js` - Tạo thông báo test

## Testing

### 1. Test gửi thông báo:
```bash
# Đăng nhập admin
# Vào tab Thông báo
# Gửi thông báo test đến 1 user
# Kiểm tra user có nhận được không
```

### 2. Test thông báo tự động:
```bash
# Đăng ký tài khoản mới từ website
# Kiểm tra admin có nhận thông báo không
```

### 3. Test database:
```bash
node backend/scripts/check-users-and-notifications.js
```

## Troubleshooting

### Lỗi: "The INSERT statement conflicted with the CHECK constraint"
**Nguyên nhân:** Type không hợp lệ (phải là info/success/warning/error)
**Giải pháp:** Đã fix trong NotificationService với type validation

### Thông báo không hiển thị:
1. Kiểm tra backend đang chạy
2. Hard refresh (Ctrl+Shift+R)
3. Kiểm tra console log
4. Kiểm tra database có thông báo không

### Số badge không cập nhật:
1. Kiểm tra API `/api/notifications/unread-count`
2. Kiểm tra `updateNotificationCount()` được gọi
3. Kiểm tra element `#notificationCount` tồn tại

## Tính năng tương lai (có thể mở rộng)

1. ✨ Real-time notifications với WebSocket
2. 📧 Gửi email kèm thông báo
3. 🔔 Push notifications trên browser
4. 📱 Mobile notifications
5. 🎯 Lọc và tìm kiếm thông báo
6. 📊 Thống kê chi tiết về thông báo
7. ⏰ Lên lịch gửi thông báo
8. 📎 Đính kèm file trong thông báo
9. 🎨 Template thông báo có sẵn
10. 🔄 Gửi lại thông báo

## Kết luận

Hệ thống thông báo đã hoàn thiện với đầy đủ tính năng:
- ✅ Admin nhận thông báo tự động
- ✅ Admin gửi thông báo đến user
- ✅ User nhận và xem thông báo
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Lịch sử gửi thông báo
- ✅ Badge số lượng chưa đọc
- ✅ Validation type đúng chuẩn database
