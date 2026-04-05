# 📊 Hướng dẫn Quản lý Tích điểm cho Admin

## 🎯 Tổng quan

Hệ thống quản lý tích điểm cho Admin Dashboard đã được tạo mới, cho phép admin:
- ✅ Xem danh sách thành viên và điểm của họ
- ✅ Thêm/trừ điểm cho từng thành viên
- ✅ Xem lịch sử giao dịch điểm
- ✅ Xem thống kê tổng quan
- ✅ Tìm kiếm và lọc thành viên

## 📁 Files đã tạo

### Frontend
1. **dashboard/admin-points-management.html** - Giao diện quản lý điểm
2. **dashboard/js/admin-points.js** - Logic xử lý frontend

### Backend
3. **backend/routes/admin-points.js** - API endpoints

### Cập nhật
4. **backend/server.js** - Đăng ký route mới
5. **dashboard/js/dashboard-core.js** - Load giao diện mới
6. **dashboard/dashboard.html** - Thêm script admin-points.js

## 🗄️ Cấu trúc Database

Hệ thống sử dụng 2 bảng chính:

### 1. Bảng `user_points`
```sql
CREATE TABLE user_points (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    total_points INT DEFAULT 0,
    points_used INT DEFAULT 0,
    rank VARCHAR(20) DEFAULT 'bronze',
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2. Bảng `user_points_transactions`
```sql
CREATE TABLE user_points_transactions (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    points INT NOT NULL,
    type VARCHAR(50),
    note NVARCHAR(500),
    created_by INT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## 🚀 Cách sử dụng

### 1. Truy cập Dashboard Admin

```
http://localhost:3000/dashboard/dashboard.html
```

Đăng nhập với tài khoản admin:
- Email: `admin@test.com`
- Password: `admin123`

### 2. Vào tab "Tích điểm"

Click vào tab **"Tích điểm"** trên thanh navigation.

### 3. Xem thống kê

Dashboard hiển thị 4 thẻ thống kê:
- 📊 **Tổng điểm đã phát**: Tổng số điểm đã cấp cho tất cả thành viên
- 👥 **Thành viên có điểm**: Số lượng thành viên đã có điểm
- 💳 **Giao dịch tháng này**: Số giao dịch trong tháng hiện tại
- 📈 **Điểm TB/Thành viên**: Điểm trung bình mỗi thành viên

### 4. Tìm kiếm và lọc

**Tìm kiếm thành viên:**
- Nhập tên, email, hoặc số điện thoại vào ô tìm kiếm

**Lọc theo hạng:**
- Đồng (0-199 điểm)
- Bạc (200-499 điểm)
- Vàng (500-999 điểm)
- Bạch Kim (1000+ điểm)

**Sắp xếp:**
- Điểm cao → thấp
- Điểm thấp → cao
- Tên A → Z
- Hoạt động gần đây

### 5. Thêm điểm cho thành viên

**Cách 1: Từ danh sách**
1. Click nút **"Thêm điểm"** trên thẻ thành viên
2. Form sẽ tự động chọn thành viên đó

**Cách 2: Từ nút header**
1. Click nút **"Thêm điểm"** ở góc trên bên phải
2. Chọn thành viên từ dropdown

**Các loại giao dịch:**
- ✅ **Điểm danh** (+10 điểm)
- 🎉 **Tham gia sự kiện** (+20 điểm)
- 🏆 **Thắng giải** (+50 điểm)
- ⭐ **Thành tích đặc biệt** (+30 điểm)
- 👥 **Giới thiệu thành viên** (+15 điểm)
- ⚙️ **Tùy chỉnh** (nhập số điểm tùy ý)
- ➖ **Trừ điểm** (nhập số điểm muốn trừ)

**Ghi chú:**
- Có thể thêm ghi chú cho mỗi giao dịch
- Ghi chú sẽ hiển thị trong lịch sử

### 6. Xem chi tiết thành viên

Click nút **"Chi tiết"** trên thẻ thành viên để xem:
- 📋 Thông tin cá nhân
- 📊 Thống kê điểm
- 📜 Lịch sử giao dịch đầy đủ

## 🎨 Giao diện

### Màu sắc theo hạng:
- 🟤 **Đồng**: Gradient nâu (#cd7f32)
- ⚪ **Bạc**: Gradient xám bạc (#c0c0c0)
- 🟡 **Vàng**: Gradient vàng (#ffd700)
- 💎 **Bạch Kim**: Gradient xanh nhạt (#e5e4e2)

### Thẻ thành viên hiển thị:
- Avatar với chữ cái đầu
- Họ tên đầy đủ
- Email và số điện thoại
- Hạng hiện tại
- Tổng điểm
- Nút hành động

## 🔧 API Endpoints

### 1. Lấy thống kê
```
GET /api/admin/points/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPointsIssued": 1500,
    "membersWithPoints": 25,
    "monthlyTransactions": 48,
    "avgPointsPerMember": 60
  }
}
```

### 2. Lấy danh sách thành viên
```
GET /api/admin/points/members
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nguyễn Văn An",
      "phone_number": "0123456789",
      "total_points": 150,
      "points_used": 20,
      "rank": "silver"
    }
  ]
}
```

### 3. Lấy chi tiết thành viên
```
GET /api/admin/points/member/:userId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": 1,
      "full_name": "Nguyễn Văn An",
      "total_points": 150,
      "rank": "silver"
    },
    "transactions": [
      {
        "id": 1,
        "points": 10,
        "type": "attendance",
        "note": "Điểm danh ngày 21/02/2025",
        "created_at": "2025-02-21T10:00:00"
      }
    ]
  }
}
```

### 4. Thêm điểm
```
POST /api/admin/points/add
```

**Request Body:**
```json
{
  "user_id": 1,
  "points": 10,
  "type": "attendance",
  "note": "Điểm danh ngày 21/02/2025"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thêm điểm thành công",
  "data": {
    "new_total": 160,
    "new_rank": "silver"
  }
}
```

## 🔐 Bảo mật

- ✅ Chỉ admin mới có quyền truy cập
- ✅ Middleware `authenticate` và `requireRole(['admin'])`
- ✅ Ghi log audit cho mọi thao tác
- ✅ Validate dữ liệu đầu vào

## 📝 Ghi chú quan trọng

### Hệ thống hạng tự động:
- **Đồng**: 0-199 điểm
- **Bạc**: 200-499 điểm
- **Vàng**: 500-999 điểm
- **Bạch Kim**: 1000+ điểm

### Trừ điểm:
- Chọn loại "Trừ điểm"
- Nhập số điểm muốn trừ (số dương)
- Hệ thống tự động chuyển thành số âm
- Kiểm tra đủ điểm trước khi trừ

### Tự động tạo record:
- Nếu thành viên chưa có trong `user_points`, hệ thống tự động tạo
- Điểm khởi đầu: 0
- Hạng khởi đầu: Đồng

## 🐛 Xử lý lỗi

### Lỗi: "Không thể tải dữ liệu"
**Nguyên nhân:** Backend không chạy hoặc database chưa có bảng

**Giải pháp:**
1. Kiểm tra backend đang chạy: `http://localhost:3000/api/health`
2. Kiểm tra database có bảng `user_points` và `user_points_transactions`
3. Chạy script tạo bảng nếu cần

### Lỗi: "Không đủ điểm để trừ"
**Nguyên nhân:** Thành viên không có đủ điểm

**Giải pháp:**
- Kiểm tra tổng điểm hiện tại
- Chỉ trừ số điểm nhỏ hơn hoặc bằng tổng điểm

### Lỗi: "Không tìm thấy thành viên"
**Nguyên nhân:** User ID không tồn tại

**Giải pháp:**
- Kiểm tra user có tồn tại trong bảng `users`
- Refresh danh sách thành viên

## 🎯 Tính năng sắp tới

- [ ] Xuất báo cáo Excel
- [ ] Thêm điểm hàng loạt
- [ ] Lịch sử chi tiết với filter
- [ ] Biểu đồ thống kê
- [ ] Thông báo tự động khi thăng hạng

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Console log (F12) để xem lỗi
2. Network tab để xem API response
3. Backend logs để xem lỗi server

---

**Cập nhật:** 2025-02-21  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn thành
