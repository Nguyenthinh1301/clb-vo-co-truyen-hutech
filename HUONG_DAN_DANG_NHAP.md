# 🔐 HƯỚNG DẪN ĐĂNG NHẬP

## ✅ BACKEND ĐÃ SẴN SÀNG!

Backend đang chạy thành công tại: **http://localhost:3000**

---

## 🎯 CÁCH ĐĂNG NHẬP

### Bước 1: Mở trang đăng nhập
```
http://localhost:3000/website/views/account/dang-nhap.html
```

### Bước 2: Nhập thông tin

**Tài khoản Admin:**
```
Email: admin@test.com
Password: admin123
```

**Tài khoản User:**
```
Email: user@test.com
Password: user123
```

### Bước 3: Click "Đăng nhập"

Sau khi đăng nhập thành công:
- **Admin** → Chuyển đến Admin Dashboard
- **User** → Chuyển đến User Dashboard

---

## 🎨 CHỨC NĂNG SAU KHI ĐĂNG NHẬP

### Admin Dashboard:
- 📊 **Tổng quan** - Thống kê hệ thống
- 👥 **Thành viên** - Quản lý users
- 🎓 **Lớp học** - Quản lý classes
- 📅 **Sự kiện** - Quản lý events
- 🔔 **Thông báo** - Gửi thông báo
- ⭐ **Tích điểm** - Hệ thống tích điểm (MỚI!)
- 📈 **Báo cáo** - Xem báo cáo
- ⚙️ **Hệ thống** - Cài đặt

### User Dashboard:
- 🏠 **Tổng quan** - Thông tin cá nhân
- 👤 **Thông tin cá nhân** - Xem profile
- 🎓 **Lớp học của tôi** - Lớp đã đăng ký
- 📅 **Sự kiện** - Sự kiện sắp tới
- ⏰ **Lịch tập** - Lịch tập luyện
- ⭐ **Tích điểm** - Xem điểm và đổi quà (MỚI!)
- 🔔 **Thông báo** - Thông báo từ CLB

---

## ⭐ HỆ THỐNG TÍCH ĐIỂM

### Cách xem:
1. Đăng nhập thành công
2. Click tab **"Tích điểm"** (⭐) trên sidebar
3. Hard refresh nếu cần: `Ctrl + Shift + R`

### Tính năng:
- 📊 **4 Stat Cards**: Tổng điểm, Điểm khả dụng, Đã đổi quà, Hạng hiện tại
- 📈 **Progress Bar**: Tiến độ thăng hạng
- 🏅 **4 Rank Levels**: Đồng (0-29), Bạc (30-59), Vàng (60-89), Kim Cương (90-100)
- 🎁 **9 Phần quà**: Từ 15-100 điểm
- 📜 **4 Tabs**: Đổi quà, Lịch sử, Bảng xếp hạng, Thành tích

---

## 🐛 KHẮC PHỤC SỰ CỐ

### Lỗi: "Backend không hoạt động"
**Giải pháp**: Khởi động backend
```bash
cd backend
npm start
```

### Lỗi: "Email hoặc mật khẩu không chính xác"
**Giải pháp**: Sử dụng đúng tài khoản test:
- Email: `admin@test.com`
- Password: `admin123`

### Lỗi: Trang trắng sau đăng nhập
**Giải pháp**: Hard refresh
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### Lỗi: "Tích điểm" không hiển thị
**Giải pháp**:
1. Hard refresh: `Ctrl + Shift + R`
2. Xóa cache: F12 → Application → Clear storage
3. Thử Incognito mode

---

## 📝 TÀI KHOẢN KHÁC

Ngoài 2 tài khoản test, còn có các tài khoản khác trong database:

### Admin:
- `admin@vocotruyenhutech.edu.vn`
- `admin@hutech.edu.vn`

### User:
- `member@hutech.edu.vn`
- `demo@test.com`
- `user@hutech.edu.vn`

**Lưu ý**: Các tài khoản này có thể có password khác. Nên dùng tài khoản test đã tạo.

---

## 🔧 KIỂM TRA BACKEND

### Kiểm tra backend có chạy không:
```bash
curl http://localhost:3000/health
```

### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Server is running",
  "database": {
    "success": true,
    "message": "Database connected"
  }
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

- `BACKEND_FIXED_COMPLETE.md` - Tổng kết đầy đủ
- `FIX_BACKEND_LOGIN.md` - Chi tiết lỗi đã sửa
- `VERIFY_POINTS_SYSTEM.md` - Hướng dẫn tích điểm
- `QUICK_START_POINTS.md` - Hướng dẫn nhanh tích điểm

---

## 🎉 HOÀN TẤT!

**Backend đã sẵn sàng và đăng nhập hoạt động hoàn hảo!**

Bạn có thể:
1. ✅ Đăng nhập với tài khoản test
2. ✅ Xem và quản lý dashboard
3. ✅ Sử dụng hệ thống tích điểm
4. ✅ Test tất cả chức năng

**Chúc bạn sử dụng hệ thống thành công! 🚀**

---

*Hướng dẫn bởi Kiro AI Assistant - 2026-02-20*
