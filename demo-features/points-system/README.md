# Demo: Hệ Thống Tích Điểm Thành Viên

## Tổng Quan

Hệ thống tích điểm giúp khuyến khích thành viên tham gia các hoạt động của CLB thông qua việc tích lũy điểm và đổi quà.

## Tính Năng

### 1. Tích Điểm (Tối đa 100 điểm/hoạt động)
- ✅ Điểm danh lớp học: +10 điểm/buổi
- ✅ Tham gia sự kiện: +20 điểm/sự kiện
- ✅ Thi đấu giải võ: +50 điểm
- ✅ Giới thiệu thành viên mới: +30 điểm
- ✅ Hoàn thành bài tập: +15 điểm
- ✅ Đạt thành tích xuất sắc: +100 điểm (tối đa)

### 2. Xếp Hạng (Thang điểm 100)
- 🥉 Đồng (0-29 điểm)
- 🥈 Bạc (30-59 điểm)
- 🥇 Vàng (60-89 điểm)
- 💎 Kim Cương (90-100 điểm)

### 3. Đổi Quà
- 🎁 Bình nước CLB: 15 điểm
- 🎁 Áo CLB: 30 điểm
- 🎁 Găng tay võ: 50 điểm
- 🎁 Đai võ: 70 điểm
- 🎁 Giảm 50% học phí: 85 điểm
- 🎁 Khóa học miễn phí: 100 điểm

### 4. Nhiệm Vụ Hàng Ngày
- ✅ Điểm danh: +5 điểm
- ✅ Tập luyện 30 phút: +10 điểm
- ✅ Chia sẻ bài viết CLB: +5 điểm

### 5. Thành Tích
- 🏆 Streak 7 ngày liên tục: +15 điểm
- 🏆 Streak 30 ngày: +30 điểm
- 🏆 Tham gia 50 buổi tập: +25 điểm
- 🏆 Tham gia 100 buổi tập: +40 điểm
- 🏆 Top 10 tháng: +50 điểm
- 🏆 Thành viên xuất sắc: +50 điểm

## Cấu Trúc Files

```
demo-features/points-system/
├── README.md                           # File này
├── database/
│   ├── schema.sql                      # Database schema
│   └── sample-data.sql                 # Dữ liệu mẫu
├── backend/
│   ├── routes/
│   │   ├── points.js                   # API tích điểm
│   │   ├── rewards.js                  # API đổi quà
│   │   └── leaderboard.js              # API bảng xếp hạng
│   └── services/
│       └── pointsService.js            # Logic tính điểm
├── frontend/
│   ├── user-points-dashboard.html      # Dashboard user
│   ├── admin-points-management.html    # Quản lý admin
│   ├── css/
│   │   └── points-system.css           # Styles
│   └── js/
│       ├── points-dashboard.js         # Logic dashboard
│       └── points-api.js               # API client
└── docs/
    ├── API.md                          # API documentation
    ├── INTEGRATION.md                  # Hướng dẫn tích hợp
    └── SCREENSHOTS.md                  # Screenshots demo
```

## Cách Sử Dụng Demo

### 1. Setup Database

```bash
# Chạy trong SSMS
demo-features/points-system/database/schema.sql
demo-features/points-system/database/sample-data.sql
```

### 2. Xem Demo Frontend

```bash
# Mở file trong trình duyệt
demo-features/points-system/frontend/user-points-dashboard.html
```

### 3. Test API (Optional)

```bash
# Copy routes vào backend/routes/
# Thêm vào server.js:
app.use('/api/points', require('./routes/points'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
```

## Tích Hợp Vào Dự Án Chính

Nếu muốn tích hợp vào dự án:

1. Copy database schema vào `backend/database/`
2. Copy routes vào `backend/routes/`
3. Copy frontend vào `dashboard/`
4. Thêm tab "Tích điểm" vào dashboard
5. Cập nhật navigation

## Screenshots

Xem file `docs/SCREENSHOTS.md` để xem giao diện demo.

## Lưu Ý

- ⚠️ Đây là DEMO, chưa tích hợp vào dự án chính
- ⚠️ Cần review và test kỹ trước khi deploy
- ⚠️ Có thể cần điều chỉnh theo yêu cầu thực tế
