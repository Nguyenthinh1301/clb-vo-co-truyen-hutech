# Fix: Thông báo không gửi đến Admin khi User đăng ký

## Vấn đề
Khi user mới đăng ký tài khoản, không có thông báo nào được gửi đến tài khoản Admin.

## Nguyên nhân
Bảng `notifications` trong MSSQL có CHECK constraint cho cột `type` chỉ chấp nhận các giá trị:
- `'info'`
- `'success'`
- `'warning'`
- `'error'`

Nhưng `NotificationService` đang cố gắng sử dụng các giá trị không hợp lệ:
- `'system'` ❌
- `'class'` ❌
- `'event'` ❌
- `'general'` ❌

Khi insert với type không hợp lệ, database throw error và notification không được tạo.

## Giải pháp đã áp dụng

### 1. Cập nhật `NotificationService.js`
Thêm logic validate và convert type sang giá trị hợp lệ:

```javascript
// Validate and convert type to allowed values
const validTypes = ['info', 'success', 'warning', 'error'];
let notificationType = 'info'; // default

if (validTypes.includes(type)) {
    notificationType = type;
} else {
    // Map other types to valid ones
    const typeMap = {
        'system': 'info',
        'class': 'info',
        'event': 'info',
        'general': 'info'
    };
    notificationType = typeMap[type] || 'info';
}
```

### 2. Tạo thông báo cho các user đã đăng ký
Chạy script để tạo thông báo cho 3 user đã đăng ký trước đó:
```bash
node backend/scripts/create-test-notification.js
```

## Kết quả
✅ Đã tạo thành công 3 thông báo cho Admin về 3 thành viên mới:
1. Huỳnh Thị Kim Nga (knga@gmail.com)
2. Bùi Phạm Xuân Giang (xgiang@gmail.com)
3. Quoc An (an1@gmail.com)

## Dữ liệu thực tế trong database

### Users đã đăng ký:
```
1. User ID: 29
   Username: knga
   Email: knga@gmail.com
   Full Name: Huỳnh Thị Kim Nga
   Role: student
   Status: pending
   Created: Sat Feb 21 2026 19:38:52

2. User ID: 28
   Username: xgiang
   Email: xgiang@gmail.com
   Full Name: Bùi Phạm Xuân Giang
   Role: student
   Status: pending
   Created: Sat Feb 21 2026 09:18:19

3. User ID: 27
   Username: an1
   Email: an1@gmail.com
   Full Name: Quoc An
   Role: student
   Status: pending
   Created: Sat Feb 21 2026 08:52:28
```

### Admin:
```
Admin ID: 25
Email: admin@test.com
Full Name: Admin Test
Role: admin
Status: active
```

### Notifications đã tạo:
```
1. Notification ID: 10
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03

2. Notification ID: 9
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03

3. Notification ID: 8
   User ID: 25 (Admin)
   Title: 🎉 Thành viên mới đăng ký
   Type: info
   Read: No
   Created: Sat Feb 21 2026 19:55:03
```

## Lưu ý
- Từ giờ trở đi, mỗi khi có user mới đăng ký, Admin sẽ nhận được thông báo tự động
- Thông báo sẽ hiển thị trong Dashboard Admin tại tab "Thông báo"
- Backend cần đang chạy để notification service hoạt động

## Files đã sửa
1. `backend/services/notificationService.js` - Thêm validation cho type
2. `backend/scripts/create-test-notification.js` - Script tạo thông báo thủ công
3. `backend/scripts/check-users-and-notifications.js` - Script kiểm tra database

## Cách test
1. Đăng ký tài khoản mới từ website
2. Đăng nhập vào Dashboard Admin
3. Kiểm tra tab "Thông báo" - sẽ thấy thông báo về thành viên mới

## Cách chạy script kiểm tra
```bash
# Kiểm tra users và notifications trong database
node backend/scripts/check-users-and-notifications.js

# Tạo thông báo thủ công cho các user đã đăng ký
node backend/scripts/create-test-notification.js
```
