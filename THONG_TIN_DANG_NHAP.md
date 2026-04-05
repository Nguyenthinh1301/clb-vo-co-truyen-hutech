# 🔐 THÔNG TIN ĐĂNG NHẬP

## ⚠️ QUAN TRỌNG

**Chỉ có 1 tài khoản duy nhất trong hệ thống!**

---

## ✅ THÔNG TIN ĐĂNG NHẬP ĐÚNG

```
Email: admin@test.com
Password: admin123
```

**LƯU Ý**: 
- Email là `admin@test.com` (KHÔNG phải `admin@vocotruyenhutech.edu.vn`)
- Password là `admin123`

---

## ❌ EMAIL SAI

Các email sau đây **ĐÃ BỊ XÓA** và không thể đăng nhập:

- ❌ `admin@vocotruyenhutech.edu.vn` (đã xóa)
- ❌ `admin@hutech.edu.vn` (đã xóa)
- ❌ `user@test.com` (đã xóa)
- ❌ `demo@test.com` (đã xóa)
- ❌ `member@hutech.edu.vn` (đã xóa)
- ❌ Tất cả các email khác (đã xóa)

---

## 📝 HƯỚNG DẪN ĐĂNG NHẬP

### Bước 1: Mở trang đăng nhập
```
http://localhost:3000/website/views/account/dang-nhap.html
```

### Bước 2: Nhập thông tin
- **Email hoặc Tên đăng nhập**: `admin@test.com`
- **Mật khẩu**: `admin123`

### Bước 3: Click "Đăng nhập"

### Bước 4: Sau khi đăng nhập thành công
- Tự động chuyển đến Admin Dashboard
- URL: `http://localhost:3000/dashboard/dashboard.html`

---

## 🧪 TEST ĐĂNG NHẬP

### Test qua API:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "admin123"
  }'
```

### Kết quả mong đợi:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 25,
      "email": "admin@test.com",
      "username": "admin_test",
      "role": "admin"
    },
    "token": "...",
    "refreshToken": "..."
  }
}
```

---

## 🔍 KIỂM TRA TÀI KHOẢN

### Xem tài khoản trong database:
```bash
node backend/scripts/test-direct-query.js
```

### Kết quả:
```
✅ Found 1 users:
  - ID: 25, Email: admin@test.com, Role: admin
```

---

## 🆘 KHẮC PHỤC SỰ CỐ

### Lỗi: "Email hoặc mật khẩu không chính xác"

**Nguyên nhân**: Bạn đang nhập sai email

**Giải pháp**: 
1. Xóa email hiện tại
2. Nhập chính xác: `admin@test.com`
3. Nhập password: `admin123`
4. Click "Đăng nhập"

### Lỗi: "Backend không hoạt động"

**Giải pháp**: Khởi động backend
```bash
cd backend
npm start
```

### Lỗi: Trang trắng sau đăng nhập

**Giải pháp**: Hard refresh
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

## 📊 THÔNG TIN TÀI KHOẢN

### Tài khoản duy nhất:
- **ID**: 25
- **Email**: admin@test.com
- **Username**: admin_test
- **Full Name**: Admin Test
- **Role**: admin
- **Status**: active
- **Is Active**: true

### Quyền hạn:
- ✅ Truy cập Admin Dashboard
- ✅ Quản lý users
- ✅ Quản lý classes
- ✅ Quản lý events
- ✅ Gửi notifications
- ✅ Xem reports
- ✅ Quản lý hệ thống tích điểm
- ✅ Tất cả chức năng admin

---

## 🎯 SAU KHI ĐĂNG NHẬP

### Admin Dashboard:
```
http://localhost:3000/dashboard/dashboard.html
```

### Các chức năng có sẵn:
1. 📊 **Tổng quan** - Dashboard overview
2. 👥 **Thành viên** - User management
3. 🎓 **Lớp học** - Class management
4. 📅 **Sự kiện** - Event management
5. 🔔 **Thông báo** - Send notifications
6. ⭐ **Tích điểm** - Points system (MỚI!)
7. 📈 **Báo cáo** - Reports
8. ⚙️ **Hệ thống** - System settings

---

## 💡 GHI NHỚ

**Email đăng nhập duy nhất:**
```
admin@test.com
```

**KHÔNG phải:**
- ❌ admin@vocotruyenhutech.edu.vn
- ❌ admin@hutech.edu.vn
- ❌ Bất kỳ email nào khác

---

## 📞 HỖ TRỢ

Nếu vẫn không đăng nhập được:

1. Kiểm tra backend đang chạy: `curl http://localhost:3000/health`
2. Kiểm tra email đúng: `admin@test.com`
3. Kiểm tra password đúng: `admin123`
4. Xem console (F12) để debug
5. Xem log backend trong terminal

---

**Hãy nhớ: Email là `admin@test.com`, KHÔNG phải email cũ! 🎯**

---

*Hướng dẫn bởi Kiro AI Assistant - 2026-02-20*
