# Tích hợp Hệ thống Tích Điểm

## Tổng quan

Hệ thống tích điểm đã được tích hợp vào cả Admin Dashboard và User Dashboard với giao diện giống demo:

### Admin Dashboard
- Giao diện đầy đủ giống demo user-points-dashboard.html
- Tab "Đổi quà" - Xem và quản lý phần quà
- Tab "Lịch sử" - Xem lịch sử tích điểm
- Tab "Bảng xếp hạng" - Xem top thành viên
- Tab "Thành tích" - Xem các thành tích
- Tab "Quản lý (Admin)" - Thêm điểm, quản lý hệ thống

### User Dashboard  
- Giao diện giống Admin nhưng chỉ đọc
- Xem điểm cá nhân
- Xem lịch sử tích điểm
- Xem bảng xếp hạng
- Xem thành tích đã đạt được
- Không có tab "Quản lý"

## Cài đặt Database

### Bước 1: Chạy Schema SQL

Mở SQL Server Management Studio (SSMS) và chạy các file SQL theo thứ tự:

```sql
-- 1. Tạo tables và stored procedures
USE clb_vo_co_truyen_hutech;
GO

-- Chạy file này:
demo-features/points-system/database/schema.sql
```

### Bước 2: Thêm dữ liệu mẫu (Optional)

```sql
-- 2. Thêm dữ liệu mẫu
demo-features/points-system/database/sample-data.sql
```

## Thang điểm mới (100 điểm)

### Xếp hạng
- 🥉 Đồng: 0-29 điểm
- 🥈 Bạc: 30-59 điểm
- 🥇 Vàng: 60-89 điểm
- 💎 Kim Cương: 90-100 điểm

### Cách tích điểm
- Điểm danh lớp học: +10 điểm/buổi
- Tham gia sự kiện: +20 điểm/sự kiện
- Thi đấu giải võ: +50 điểm
- Giới thiệu thành viên mới: +30 điểm
- Hoàn thành bài tập: +15 điểm
- Đạt thành tích xuất sắc: +100 điểm (tối đa)

### Phần quà
- Bình nước CLB: 15 điểm
- Áo CLB: 30 điểm
- Túi tập võ: 40 điểm
- Găng tay võ: 50 điểm
- Voucher 100k: 60 điểm
- Đai võ: 70 điểm
- Giảm 50% học phí: 85 điểm
- Buổi tập riêng với HLV: 90 điểm
- Khóa học miễn phí: 100 điểm

### Thành tích
- Người mới bắt đầu: +5 điểm
- Streak 7 ngày: +15 điểm
- Streak 30 ngày: +30 điểm
- Siêng năng (50 buổi): +25 điểm
- Chuyên cần (100 buổi): +40 điểm
- Top 10 tháng: +50 điểm
- Thành viên xuất sắc: +50 điểm

## Files đã tạo/cập nhật

### Backend
- ✅ `backend/routes/points.js` - API endpoints cho points system
- ✅ `backend/server.js` - Đã thêm route `/api/points`

### Frontend - Dashboard
- ✅ `dashboard/css/points-system.css` - Styles cho points system
- ✅ `dashboard/js/dashboard-points.js` - Logic xử lý points
- ✅ `dashboard/dashboard.html` - Đã thêm tab "Tích điểm" thay thế "Nội dung"
- ✅ `dashboard/js/dashboard-core.js` - Đã thêm xử lý section points
- ✅ `dashboard/user-dashboard.html` - Đã thêm tab "Tích điểm"
- ✅ `dashboard/js/user-dashboard.js` - Đã thêm function loadPoints()

### Database
- ✅ `demo-features/points-system/database/schema.sql` - Database schema
- ✅ `demo-features/points-system/database/sample-data.sql` - Dữ liệu mẫu

## Cách sử dụng

### Admin Dashboard

1. Đăng nhập với tài khoản admin
2. Click vào tab "Tích điểm" (thay thế tab "Nội dung" cũ)
3. Xem giao diện đầy đủ với:
   - Tổng quan điểm (4 cards)
   - Tiến độ thăng hạng
   - Tab "Đổi quà" - Danh sách phần quà
   - Tab "Lịch sử" - Lịch sử giao dịch
   - Tab "Bảng xếp hạng" - Top thành viên
   - Tab "Thành tích" - Các thành tích
   - Tab "Quản lý (Admin)" - Chức năng quản trị

### User Dashboard

1. Đăng nhập với tài khoản user
2. Click vào tab "Tích điểm"
3. Xem giao diện giống Admin nhưng:
   - Chỉ xem điểm của chính mình
   - Không có tab "Quản lý (Admin)"
   - Tất cả chức năng chỉ đọc

## API Endpoints

### GET /api/points/user/:userId
Lấy thông tin điểm của user
- User chỉ xem được điểm của chính họ
- Admin xem được điểm của tất cả users

### GET /api/points/transactions/:userId
Lấy lịch sử giao dịch điểm

### GET /api/points/leaderboard
Lấy bảng xếp hạng

### POST /api/points/add (Admin only)
Thêm điểm cho user

### GET /api/points/rewards
Lấy danh sách phần quà

### GET /api/points/achievements
Lấy danh sách thành tích

### GET /api/points/user-achievements/:userId
Lấy thành tích của user

## Testing

### 1. Test Database
```sql
-- Kiểm tra tables đã tạo
SELECT * FROM user_points;
SELECT * FROM points_transactions;
SELECT * FROM rewards;
SELECT * FROM achievements;

-- Kiểm tra view
SELECT * FROM v_leaderboard;

-- Test stored procedure
EXEC sp_add_points 
    @user_id = 1, 
    @points = 10, 
    @category = 'test', 
    @description = 'Test points';
```

### 2. Test API
```bash
# Lấy điểm của user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/points/user/1

# Lấy bảng xếp hạng
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/points/leaderboard
```

### 3. Test Frontend
1. Mở Admin Dashboard → Tab "Tích điểm"
2. Mở User Dashboard → Tab "Tích điểm"
3. Kiểm tra hiển thị điểm, lịch sử, bảng xếp hạng

## Lưu ý

- ⚠️ Phải chạy SQL schema trước khi sử dụng
- ⚠️ User chỉ có quyền XEM điểm của chính họ
- ⚠️ Admin có quyền quản lý toàn bộ hệ thống
- ⚠️ Thang điểm tối đa là 100 điểm để đạt Kim Cương

## Troubleshooting

### Lỗi: "Table does not exist"
→ Chạy lại file `schema.sql`

### Lỗi: "Cannot read properties of undefined"
→ Kiểm tra user đã đăng nhập chưa

### Không hiển thị điểm
→ Kiểm tra API endpoint `/api/points/user/:userId` có hoạt động không

### Lỗi 403 Forbidden
→ User đang cố xem điểm của người khác (chỉ admin mới được)

## Tính năng tương lai

- [ ] Đổi quà tự động
- [ ] Thông báo khi lên hạng
- [ ] Nhiệm vụ hàng ngày
- [ ] Streak bonus
- [ ] Export báo cáo điểm
- [ ] Tích hợp với attendance system

## Liên hệ

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.
