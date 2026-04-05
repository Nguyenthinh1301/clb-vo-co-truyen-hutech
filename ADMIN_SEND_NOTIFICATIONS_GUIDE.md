# Hướng Dẫn Gửi Thông Báo Từ Admin Đến User

## Tính Năng Mới

Đã tạo tính năng gửi thông báo từ Admin Dashboard đến tài khoản User với đầy đủ chức năng:

### ✅ Các Tính Năng

1. **Gửi thông báo đến nhiều người**
   - Tất cả thành viên
   - Theo vai trò (Học viên, Huấn luyện viên)
   - Chọn thành viên cụ thể

2. **Phân loại thông báo**
   - Thông báo chung
   - Lớp học
   - Sự kiện
   - Hệ thống
   - Khẩn cấp

3. **Mức độ ưu tiên**
   - Thấp
   - Bình thường
   - Cao
   - Khẩn cấp

4. **Lịch sử gửi thông báo**
   - Xem tất cả thông báo đã gửi
   - Thống kê số người nhận
   - Thời gian gửi

## Cách Sử Dụng

### Bước 1: Đăng Nhập Admin

1. Truy cập trang đăng nhập
2. Đăng nhập với tài khoản admin
3. Vào Admin Dashboard

### Bước 2: Vào Tab Thông Báo

1. Click vào tab **"Thông báo"** trên menu
2. Giao diện gửi thông báo sẽ hiển thị

### Bước 3: Điền Form Gửi Thông Báo

#### 3.1. Chọn Người Nhận

**Tất cả thành viên:**
```
Người nhận: Tất cả thành viên
→ Gửi đến tất cả user (trừ admin)
```

**Theo vai trò:**
```
Người nhận: Theo vai trò
Vai trò: Học viên / Huấn luyện viên
→ Gửi đến tất cả user có vai trò đó
```

**Chọn cụ thể:**
```
Người nhận: Chọn thành viên cụ thể
Chọn thành viên: [Danh sách user]
→ Giữ Ctrl/Cmd để chọn nhiều người
```

#### 3.2. Chọn Loại Thông Báo

- **Thông báo chung**: Thông báo thông thường
- **Lớp học**: Liên quan đến lớp học
- **Sự kiện**: Thông báo về sự kiện
- **Hệ thống**: Thông báo hệ thống
- **Khẩn cấp**: Thông báo khẩn cấp

#### 3.3. Chọn Mức Độ Ưu Tiên

- **Thấp**: Thông báo không quan trọng
- **Bình thường**: Thông báo thông thường (mặc định)
- **Cao**: Thông báo quan trọng
- **Khẩn cấp**: Cần xử lý ngay

#### 3.4. Nhập Nội Dung

```
Tiêu đề: Nhập tiêu đề thông báo (tối đa 255 ký tự)
Nội dung: Nhập nội dung chi tiết (tối đa 2000 ký tự)
```

### Bước 4: Gửi Thông Báo

1. Click nút **"Gửi thông báo"**
2. Hệ thống sẽ gửi đến tất cả người nhận đã chọn
3. Thông báo thành công sẽ hiển thị

### Bước 5: Xem Lịch Sử

Phần **"Lịch sử gửi thông báo"** hiển thị:
- Thời gian gửi
- Tiêu đề
- Loại thông báo
- Mức độ ưu tiên
- Số người nhận
- Trạng thái

## User Nhận Thông Báo

### Cách User Xem Thông Báo

1. **Đăng nhập User Dashboard**
2. **Click vào tab "Thông báo"**
3. **Xem danh sách thông báo**
   - Thông báo mới có dấu chấm đỏ
   - Click vào để đánh dấu đã đọc

### Hiển Thị Trên User Dashboard

- Badge số thông báo chưa đọc trên icon bell
- Danh sách thông báo theo thời gian
- Phân loại theo loại và mức độ ưu tiên

## Ví Dụ Sử Dụng

### Ví Dụ 1: Thông Báo Nghỉ Lớp

```
Người nhận: Theo vai trò → Học viên
Loại: Lớp học
Ưu tiên: Cao
Tiêu đề: Thông báo nghỉ lớp ngày 25/02
Nội dung: Lớp võ cơ bản sẽ nghỉ vào ngày 25/02 do huấn luyện viên có việc đột xuất. Lớp sẽ học bù vào thứ 7 tuần sau.
```

### Ví Dụ 2: Thông Báo Sự Kiện

```
Người nhận: Tất cả thành viên
Loại: Sự kiện
Ưu tiên: Bình thường
Tiêu đề: Giải võ sinh viên 2026
Nội dung: CLB tổ chức giải võ sinh viên vào ngày 15/03/2026. Mời tất cả thành viên tham gia. Đăng ký tại quầy CLB.
```

### Ví Dụ 3: Thông Báo Khẩn Cấp

```
Người nhận: Tất cả thành viên
Loại: Khẩn cấp
Ưu tiên: Khẩn cấp
Tiêu đề: Thay đổi địa điểm tập luyện
Nội dung: Do sân tập đang bảo trì, tất cả lớp học từ ngày 20-25/02 sẽ chuyển sang sân B2. Vui lòng lưu ý!
```

## Cấu Trúc File

### Frontend

```
dashboard/
├── dashboard.html (Đã thêm tab Thông báo)
└── js/
    ├── dashboard-core.js (Đã thêm case notifications)
    └── dashboard-notifications.js (Mới tạo)
```

### Backend

```
backend/
├── server.js (Đã thêm route admin-notifications)
└── routes/
    ├── notifications.js (Route cho user)
    └── admin-notifications.js (Mới tạo - Route cho admin)
```

## API Endpoints

### Admin APIs

#### 1. Gửi Thông Báo
```
POST /api/admin/notifications/send
Authorization: Bearer {admin_token}

Body:
{
  "recipients": [1, 2, 3],
  "type": "general",
  "priority": "normal",
  "title": "Tiêu đề",
  "message": "Nội dung"
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

#### 2. Lịch Sử Thông Báo
```
GET /api/admin/notifications/history?page=1&limit=20
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "general",
      "priority": "normal",
      "title": "Tiêu đề",
      "message": "Nội dung",
      "created_at": "2026-02-20T10:00:00Z",
      "recipient_count": 3
    }
  ]
}
```

#### 3. Thống Kê Thông Báo
```
GET /api/admin/notifications/stats
Authorization: Bearer {admin_token}

Response:
{
  "success": true,
  "data": {
    "totalSent": 50,
    "unread": 20,
    "byType": [
      { "type": "general", "count": 30 },
      { "type": "class", "count": 15 }
    ]
  }
}
```

### User APIs

#### 1. Lấy Thông Báo
```
GET /api/notifications/my-notifications?page=1&limit=10
Authorization: Bearer {user_token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "general",
      "priority": "normal",
      "title": "Tiêu đề",
      "message": "Nội dung",
      "is_read": 0,
      "created_at": "2026-02-20T10:00:00Z"
    }
  ]
}
```

#### 2. Đánh Dấu Đã Đọc
```
PATCH /api/notifications/:id/read
Authorization: Bearer {user_token}

Response:
{
  "success": true,
  "message": "Đã đánh dấu thông báo là đã đọc"
}
```

## Database Schema

### Table: notifications

```sql
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## Troubleshooting

### Lỗi: "Không thể gửi thông báo"

**Nguyên nhân**: Backend không chạy hoặc không có quyền admin

**Giải pháp**:
1. Kiểm tra backend đang chạy
2. Kiểm tra đăng nhập với tài khoản admin
3. Kiểm tra console log

### Lỗi: "Không có người nhận"

**Nguyên nhân**: Chưa chọn người nhận

**Giải pháp**:
1. Chọn loại người nhận
2. Nếu chọn "Chọn thành viên cụ thể", phải chọn ít nhất 1 người

### User không nhận được thông báo

**Nguyên nhân**: User chưa đăng nhập hoặc cache

**Giải pháp**:
1. User cần đăng nhập lại
2. Refresh trang User Dashboard
3. Kiểm tra database có record không

## Tính Năng Tương Lai

- [ ] Gửi email kèm thông báo
- [ ] Push notification (web push)
- [ ] Lên lịch gửi thông báo
- [ ] Template thông báo
- [ ] Đính kèm file
- [ ] Thông báo có hình ảnh
- [ ] Thống kê tỷ lệ đọc

## Kết Luận

Tính năng gửi thông báo đã hoàn thiện và sẵn sàng sử dụng. Admin có thể gửi thông báo đến user một cách dễ dàng và hiệu quả.
