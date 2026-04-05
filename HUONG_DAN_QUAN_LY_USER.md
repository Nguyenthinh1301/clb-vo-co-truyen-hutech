# 📋 HƯỚNG DẪN QUẢN LÝ THÀNH VIÊN VÀ PHÂN LỚP HỌC

## 🎯 Tổng Quan

Hệ thống quản lý thành viên cho phép admin:
- Xem danh sách tất cả thành viên
- Phê duyệt thành viên mới
- Cập nhật thông tin thành viên
- Phân công thành viên vào lớp học
- Theo dõi thống kê và hoạt động

## 📊 Thống Kê Hiện Tại

Chạy lệnh để xem thống kê:

```bash
cd backend
npm run get-users
```

Kết quả hiện tại:
- **Tổng số user**: 6
- **Admin**: 1 (admin@test.com)
- **Instructor**: 0
- **Student**: 5
  - an1@gmail.com (Quoc An)
  - xgiang@gmail.com (Bùi Phạm Xuân Giang)
  - knga@gmail.com (Huỳnh Thị Kim Nga)
  - huy@gmail.com (Phạm Đắc Trường Huy)
  - test1771654319814@gmail.com (Test User)

**Trạng thái**: Tất cả 5 sinh viên đang ở trạng thái `pending` (chờ phê duyệt)

## 🔄 Đồng Bộ User Lên Admin Dashboard

### Bước 1: Kiểm tra user chưa được phân lớp

```bash
cd backend
npm run sync-users
```

Kết quả sẽ hiển thị:
- Danh sách user chưa được phân lớp
- Danh sách lớp học có sẵn
- Sĩ số và chỗ trống của mỗi lớp

### Bước 2: Truy cập Admin Dashboard

1. Đảm bảo backend đang chạy:
```bash
cd backend
npm start
```

2. Mở trình duyệt và truy cập:
```
http://localhost:3001/dashboard/admin-user-management.html
```

3. Đăng nhập với tài khoản admin:
- Email: `admin@test.com`
- Password: `Admin123456`

## 📚 Các Chức Năng Quản Lý

### 1. Xem Danh Sách Thành Viên

Dashboard hiển thị:
- **Tổng thành viên**: Số lượng tất cả user
- **Chờ phê duyệt**: User có status = pending
- **Đã kích hoạt**: User có status = active
- **Chưa phân lớp**: User chưa được assign vào lớp nào

### 2. Phê Duyệt Thành Viên

**Cách 1: Từ Dashboard**
1. Tìm user có trạng thái "Chờ phê duyệt"
2. Click nút "✓ Duyệt"
3. Xác nhận phê duyệt
4. User sẽ chuyển sang trạng thái "active"

**Cách 2: Qua API**
```bash
curl -X POST http://localhost:3001/api/admin/users/{userId}/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Cập Nhật Thông Tin Thành Viên

1. Click nút "✏️ Sửa" bên cạnh user
2. Cập nhật thông tin:
   - Họ tên
   - Số điện thoại
   - Trạng thái
   - Ghi chú
3. Click "Lưu Thay Đổi"

### 4. Phân Công Lớp Học

**Phương pháp 1: Phân công từng user**

1. Click nút "📚 Phân lớp" bên cạnh user
2. Chọn lớp học phù hợp từ danh sách
3. Xem thông tin lớp:
   - Tên lớp
   - Lịch học
   - Địa điểm
   - Sĩ số hiện tại
4. Click "Phân công vào lớp này"
5. User sẽ nhận thông báo về lớp học được phân công

**Phương pháp 2: Phân công hàng loạt (Bulk Assign)**

Sử dụng API để phân công nhiều user cùng lúc:

```javascript
// Ví dụ: Phân công tất cả 5 sinh viên vào lớp "Võ Cơ Bản"
const userIds = [27, 28, 29, 30, 31]; // IDs của 5 sinh viên
const classId = 1; // ID của lớp "Võ Cơ Bản"

fetch('http://localhost:3001/api/admin/class-management/bulk-assign', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userIds, classId })
});
```

### 5. Xem Chi Tiết Thành Viên

1. Click nút "👁️ Xem" bên cạnh user
2. Xem thông tin chi tiết:
   - Thông tin cá nhân
   - Danh sách lớp học đã đăng ký
   - Thống kê điểm danh
   - Tỷ lệ tham gia

## 🔍 Tìm Kiếm và Lọc

### Tìm kiếm
- Nhập email, tên, hoặc số điện thoại vào ô tìm kiếm
- Kết quả tự động cập nhật sau 0.5 giây

### Lọc theo trạng thái
- **Tất cả**: Hiển thị tất cả user
- **Chờ phê duyệt**: Chỉ user có status = pending
- **Đã kích hoạt**: Chỉ user có status = active
- **Không hoạt động**: Chỉ user có status = inactive

### Lọc theo vai trò
- **Tất cả**: Hiển thị tất cả vai trò
- **Học viên**: Chỉ student
- **Giảng viên**: Chỉ instructor
- **Quản trị viên**: Chỉ admin

## 📝 Quy Trình Xử Lý User Mới

### Bước 1: User đăng ký
- User điền form đăng ký trên website
- Tài khoản được tạo với status = "pending"
- User nhận email xác nhận

### Bước 2: Admin kiểm tra
```bash
# Xem danh sách user mới
cd backend
npm run get-users

# Hoặc xem user chưa phân lớp
npm run sync-users
```

### Bước 3: Admin phê duyệt
1. Truy cập dashboard: http://localhost:3001/dashboard/admin-user-management.html
2. Tìm user trong danh sách "Chờ phê duyệt"
3. Kiểm tra thông tin user
4. Click "✓ Duyệt" để phê duyệt
5. User nhận thông báo phê duyệt

### Bước 4: Phân công lớp học
1. Click "📚 Phân lớp" bên cạnh user đã được phê duyệt
2. Chọn lớp học phù hợp dựa trên:
   - Trình độ của user
   - Lịch học phù hợp
   - Địa điểm gần nhà
   - Sĩ số lớp còn chỗ trống
3. Xác nhận phân công
4. User nhận thông báo về lớp học

### Bước 5: User bắt đầu học
- User đăng nhập vào dashboard
- Xem thông tin lớp học
- Xem lịch học
- Tham gia điểm danh

## 🎓 Quản Lý Lớp Học

### Xem danh sách lớp hiện có

```bash
# Trong database có 2 lớp:
# 1. Võ Cơ Bản - Sài Gòn Campus (ID: 1)
#    - Lịch: Thứ 2, 4, 6 - 18:00-20:00
#    - Địa điểm: Sân tập HUTECH - Sài Gòn Campus
#    - Sĩ số: 1/30

# 2. Võ Nâng Cao - Thủ Đức Campus (ID: 2)
#    - Lịch: Thứ 3, 5, 7 - 19:00-21:00
#    - Địa điểm: Sân tập HUTECH - Thủ Đức Campus
#    - Sĩ số: 1/30
```

### Tạo lớp học mới

Truy cập: http://localhost:3001/dashboard/admin-class-management.html

Hoặc sử dụng API:
```javascript
fetch('http://localhost:3001/api/classes', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Võ Trung Cấp',
        description: 'Lớp dành cho học viên có kinh nghiệm',
        schedule: 'Thứ 2, 4, 6 - 19:00-21:00',
        location: 'Sân tập HUTECH - Sài Gòn Campus',
        max_students: 25,
        status: 'active'
    })
});
```

## 📧 Thông Báo Tự Động

Hệ thống tự động gửi thông báo khi:

1. **User được phê duyệt**
   - Tiêu đề: "🎉 Tài khoản đã được phê duyệt"
   - Nội dung: Thông báo tài khoản đã kích hoạt

2. **User được phân lớp**
   - Tiêu đề: "📚 Bạn đã được phân công vào lớp học"
   - Nội dung: Thông tin lớp học, lịch học, địa điểm

3. **Cập nhật thông tin**
   - Thông báo khi admin cập nhật thông tin user

## 🛠️ Các Lệnh Hữu Ích

```bash
# Xem tất cả user
npm run get-users

# Xem user chưa phân lớp
npm run sync-users

# Kiểm tra một user cụ thể
npm run check-user an1@gmail.com

# Khởi động backend
npm start

# Xem logs
tail -f logs/combined.log
```

## 🔐 API Endpoints

### User Management
- `GET /api/admin/users` - Lấy danh sách user
- `GET /api/admin/users/:id/profile` - Xem chi tiết user
- `POST /api/admin/users/:id/approve` - Phê duyệt user
- `PATCH /api/admin/users/:id/profile` - Cập nhật thông tin user
- `DELETE /api/admin/users/:id` - Xóa user (soft delete)

### Class Management
- `GET /api/classes` - Lấy danh sách lớp học
- `POST /api/admin/class-management/assign` - Phân công user vào lớp
- `POST /api/admin/class-management/bulk-assign` - Phân công hàng loạt
- `DELETE /api/admin/class-management/remove` - Xóa user khỏi lớp
- `GET /api/admin/class-management/unassigned-users` - User chưa phân lớp
- `GET /api/admin/class-management/class-members/:classId` - Danh sách user trong lớp

## 📊 Ví Dụ Thực Tế

### Kịch bản: Phân công 5 sinh viên hiện tại

```bash
# Bước 1: Xem danh sách sinh viên
cd backend
npm run sync-users

# Kết quả:
# 1. an1@gmail.com (ID: 27) - Quoc An
# 2. xgiang@gmail.com (ID: 28) - Bùi Phạm Xuân Giang
# 3. knga@gmail.com (ID: 29) - Huỳnh Thị Kim Nga
# 4. huy@gmail.com (ID: 30) - Phạm Đắc Trường Huy
# 5. test1771654319814@gmail.com (ID: 31) - Test User

# Bước 2: Phê duyệt tất cả (qua dashboard hoặc API)

# Bước 3: Phân lớp
# - Phân 3 sinh viên vào "Võ Cơ Bản" (ID: 1)
# - Phân 2 sinh viên vào "Võ Nâng Cao" (ID: 2)
```

## 🎯 Checklist Hoàn Thành

- [x] Backend API hoạt động (port 3001)
- [x] Database MSSQL kết nối thành công
- [x] Có 5 sinh viên chờ phê duyệt
- [x] Có 2 lớp học sẵn sàng
- [x] Admin dashboard đã tạo
- [x] Scripts quản lý user đã sẵn sàng
- [ ] Phê duyệt 5 sinh viên
- [ ] Phân công sinh viên vào lớp học
- [ ] Gửi thông báo cho sinh viên

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra backend đang chạy: http://localhost:3001/health
2. Kiểm tra logs: `backend/logs/combined.log`
3. Chạy lại sync: `npm run sync-users`
4. Kiểm tra database connection trong file `.env`

---

**Cập nhật**: 22/02/2026
**Trạng thái**: ✅ Sẵn sàng sử dụng
