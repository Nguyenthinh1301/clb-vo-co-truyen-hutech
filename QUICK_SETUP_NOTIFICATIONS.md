# Setup Nhanh Tính Năng Thông Báo

## Bước 1: Tạo Bảng Notifications

### Cách 1: Chạy SQL Script (Khuyến nghị)

1. Mở **SQL Server Management Studio (SSMS)**
2. Kết nối đến `localhost\SQLEXPRESS`
3. Mở file: `backend/database/create-notifications-table.sql`
4. Chạy script (F5)

### Cách 2: Chạy SQL Trực Tiếp

```sql
USE clb_vo_co_truyen_hutech;
GO

CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    type NVARCHAR(50) DEFAULT 'general',
    priority NVARCHAR(50) DEFAULT 'normal',
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    is_read BIT DEFAULT 0,
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
GO
```

## Bước 2: Đảm Bảo Có User Demo

Chạy script tạo user demo (nếu chưa có):

```bash
cd backend
node scripts/seed-demo-users.js
```

Hoặc chạy SQL:

```bash
cd backend
node scripts/insert-demo-users.sql
```

## Bước 3: Test Hệ Thống

Chạy script test:

```bash
cd backend
node scripts/test-send-notification.js
```

Script sẽ:
- ✅ Kiểm tra database connection
- ✅ Kiểm tra bảng notifications
- ✅ Tìm admin user
- ✅ Tìm regular users
- ✅ Tạo thông báo test
- ✅ Gửi thông báo đến tất cả users

## Bước 4: Khởi Động Backend

```bash
cd backend
npm start
```

Backend sẽ chạy tại: http://localhost:3000

## Bước 5: Test Trên Giao Diện

### Test Admin Gửi Thông Báo:

1. Mở trình duyệt: http://localhost:5500/dashboard/dashboard.html
2. Đăng nhập với admin:
   - Email: `admin@hutech.edu.vn`
   - Password: `admin123`
3. Click tab **"Thông báo"**
4. Điền form:
   ```
   Người nhận: Tất cả thành viên
   Loại: Thông báo chung
   Ưu tiên: Bình thường
   Tiêu đề: Chào mừng các bạn
   Nội dung: Đây là thông báo test từ admin
   ```
5. Click **"Gửi thông báo"**

### Test User Nhận Thông Báo:

1. Đăng xuất admin
2. Đăng nhập với user:
   - Email: `demo@test.com`
   - Password: `123456`
3. Vào User Dashboard
4. Click tab **"Thông báo"**
5. Xem thông báo vừa nhận

## Troubleshooting

### Lỗi: "Table notifications does not exist"

**Giải pháp**: Chạy lại Bước 1

### Lỗi: "No admin user found"

**Giải pháp**: Chạy script tạo user demo:
```bash
node backend/scripts/seed-demo-users.js
```

### Lỗi: "Cannot connect to database"

**Giải pháp**: 
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra file `.env`:
   ```
   DB_TYPE=mssql
   MSSQL_SERVER=localhost\SQLEXPRESS
   MSSQL_DATABASE=clb_vo_co_truyen_hutech
   ```

### Lỗi: "Backend không chạy"

**Giải pháp**:
```bash
cd backend
npm install
npm start
```

## Kiểm Tra Nhanh

### 1. Kiểm tra bảng notifications:

```sql
SELECT * FROM notifications;
```

### 2. Kiểm tra users:

```sql
SELECT id, email, role FROM users;
```

### 3. Kiểm tra backend health:

```bash
curl http://localhost:3000/health
```

## API Test với Postman/cURL

### Gửi thông báo (Admin):

```bash
curl -X POST http://localhost:3000/api/admin/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "recipients": [1, 2, 3],
    "type": "general",
    "priority": "normal",
    "title": "Test Notification",
    "message": "This is a test"
  }'
```

### Lấy thông báo (User):

```bash
curl http://localhost:3000/api/notifications/my-notifications \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

## Xác Nhận Hoàn Tất

Sau khi setup, bạn có thể:
- ✅ Admin gửi thông báo từ dashboard
- ✅ User nhận và xem thông báo
- ✅ Đánh dấu thông báo đã đọc
- ✅ Xem lịch sử gửi thông báo

## Files Quan Trọng

```
backend/
├── database/
│   └── create-notifications-table.sql  ← Tạo bảng
├── routes/
│   ├── notifications.js                ← User APIs
│   └── admin-notifications.js          ← Admin APIs
└── scripts/
    ├── seed-demo-users.js              ← Tạo users
    └── test-send-notification.js       ← Test script

dashboard/
├── dashboard.html                      ← Admin UI
└── js/
    └── dashboard-notifications.js      ← Admin logic
```

## Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12)
2. Kiểm tra backend terminal
3. Kiểm tra database có dữ liệu không
4. Xem file `ADMIN_SEND_NOTIFICATIONS_GUIDE.md` để biết chi tiết
