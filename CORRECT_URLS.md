# 🔗 ĐƯỜNG DẪN ĐÚNG ĐỂ TRUY CẬP HỆ THỐNG

## ❌ LỖI THƯỜNG GẶP

```
Cannot GET /views/account/dang-nhap.html
```

**Nguyên nhân:** Thiếu thư mục `website` trong URL

---

## ✅ ĐƯỜNG DẪN ĐÚNG

### 🏠 Trang Chủ
```
http://localhost:3000/website/index.html
```

### 🔐 Đăng Nhập
```
http://localhost:3000/website/views/account/dang-nhap.html
```

### 📝 Đăng Ký
```
http://localhost:3000/website/views/account/dang-ky.html
```

### 👤 User Dashboard
```
http://localhost:3000/dashboard/user-dashboard.html
```

### 🛡️ Admin Dashboard
```
http://localhost:3000/dashboard/dashboard.html
```

---

## 📂 CẤU TRÚC THƯ MỤC

```
http://localhost:3000/
├── website/                    ← Phải có thư mục này!
│   ├── index.html             → /website/index.html
│   └── views/
│       └── account/
│           ├── dang-nhap.html → /website/views/account/dang-nhap.html
│           └── dang-ky.html   → /website/views/account/dang-ky.html
└── dashboard/
    ├── user-dashboard.html    → /dashboard/user-dashboard.html
    └── dashboard.html         → /dashboard/dashboard.html
```

---

## 🔧 CÁCH FIX

### Cách 1: Sửa URL trong Browser

**Sai:**
```
http://localhost:3000/views/account/dang-nhap.html  ❌
```

**Đúng:**
```
http://localhost:3000/website/views/account/dang-nhap.html  ✅
```

### Cách 2: Truy cập từ Trang Chủ

1. Mở: `http://localhost:3000/website/index.html`
2. Click nút "Đăng nhập" trên header
3. Sẽ tự động redirect đúng URL

### Cách 3: Bookmark URLs Đúng

Lưu các URLs này vào bookmark:

```
Trang chủ:    http://localhost:3000/website/index.html
Đăng nhập:    http://localhost:3000/website/views/account/dang-nhap.html
Đăng ký:      http://localhost:3000/website/views/account/dang-ky.html
User Dashboard: http://localhost:3000/dashboard/user-dashboard.html
Admin Dashboard: http://localhost:3000/dashboard/dashboard.html
```

---

## 🧪 TEST LINKS

Click vào các links này để test:

### Frontend (Website)
- [Trang chủ](http://localhost:3000/website/index.html)
- [Đăng nhập](http://localhost:3000/website/views/account/dang-nhap.html)
- [Đăng ký](http://localhost:3000/website/views/account/dang-ky.html)

### Dashboard
- [User Dashboard](http://localhost:3000/dashboard/user-dashboard.html)
- [Admin Dashboard](http://localhost:3000/dashboard/dashboard.html)
- [Admin Content Management](http://localhost:3000/dashboard/admin-content-management.html)

### Backend API
- [Health Check](http://localhost:3000/health)
- [API Docs](http://localhost:3000/api-docs) (nếu có)

---

## 🚀 QUICK START

### Bước 1: Khởi động Backend
```bash
cd backend
npm start
```

### Bước 2: Mở Browser
```
http://localhost:3000/website/index.html
```

### Bước 3: Đăng nhập
Click "Đăng nhập" trên header hoặc truy cập trực tiếp:
```
http://localhost:3000/website/views/account/dang-nhap.html
```

### Bước 4: Sử dụng tài khoản test

**Admin:**
- Email: `admin@hutech.edu.vn`
- Password: `admin123`

**Member:**
- Email: `member@hutech.edu.vn`
- Password: `member123`

---

## 🔍 TROUBLESHOOTING

### Lỗi: Cannot GET /views/account/dang-nhap.html

**Giải pháp:**
```
Thêm /website/ vào đầu URL:
http://localhost:3000/website/views/account/dang-nhap.html
```

### Lỗi: Cannot GET /website/views/account/dang-nhap.html

**Nguyên nhân:** Backend chưa chạy hoặc port sai

**Giải pháp:**
1. Kiểm tra backend đang chạy:
   ```bash
   curl http://localhost:3000/health
   ```

2. Nếu không chạy, start backend:
   ```bash
   cd backend
   npm start
   ```

### Lỗi: 404 Not Found

**Nguyên nhân:** File không tồn tại hoặc đường dẫn sai

**Giải pháp:**
1. Verify file tồn tại:
   ```bash
   ls website/views/account/dang-nhap.html
   ```

2. Kiểm tra backend serve static files:
   ```javascript
   // Trong backend/server.js
   app.use(express.static('.'));
   ```

---

## 📋 CHECKLIST

Khi gặp lỗi "Cannot GET", kiểm tra:

- [ ] URL có bắt đầu bằng `http://localhost:3000/` không?
- [ ] URL có chứa `/website/` cho frontend files không?
- [ ] Backend đang chạy ở port 3000 không?
- [ ] File thực sự tồn tại trong thư mục không?
- [ ] Không có typo trong URL không?

---

## 🎯 URL PATTERNS

### Frontend Files (cần /website/)
```
✅ /website/index.html
✅ /website/views/account/dang-nhap.html
✅ /website/views/account/dang-ky.html
✅ /website/components/header.html
✅ /website/styles.css
```

### Dashboard Files (không cần /website/)
```
✅ /dashboard/user-dashboard.html
✅ /dashboard/dashboard.html
✅ /dashboard/admin-content-management.html
✅ /dashboard/css/dashboard.css
✅ /dashboard/js/dashboard-core.js
```

### Backend API (không cần /website/)
```
✅ /health
✅ /api/auth/login
✅ /api/user/profile
✅ /api/admin/users
```

---

## 💡 PRO TIPS

### Tip 1: Sử dụng Relative Links
Trong HTML, dùng relative paths để tránh hardcode domain:

```html
<!-- Tốt -->
<a href="views/account/dang-nhap.html">Đăng nhập</a>

<!-- Tránh -->
<a href="http://localhost:3000/website/views/account/dang-nhap.html">Đăng nhập</a>
```

### Tip 2: Base Tag
Thêm base tag trong HTML để set base URL:

```html
<head>
    <base href="/website/">
    <!-- Giờ tất cả relative paths sẽ relative to /website/ -->
</head>
```

### Tip 3: Browser DevTools
Mở F12 → Network tab để xem requests và tìm 404 errors

### Tip 4: Live Server Extension
Nếu dùng VS Code, cài Live Server extension để auto-reload

---

## 🔗 QUICK LINKS COPY-PASTE

```
Trang chủ:
http://localhost:3000/website/index.html

Đăng nhập:
http://localhost:3000/website/views/account/dang-nhap.html

Đăng ký:
http://localhost:3000/website/views/account/dang-ky.html

User Dashboard:
http://localhost:3000/dashboard/user-dashboard.html

Admin Dashboard:
http://localhost:3000/dashboard/dashboard.html

Backend Health:
http://localhost:3000/health
```

---

## ✅ FINAL CHECKLIST

Trước khi truy cập, đảm bảo:

1. ✅ Backend đang chạy (`npm start` trong thư mục backend)
2. ✅ Port 3000 không bị chiếm bởi process khác
3. ✅ URL bắt đầu với `http://localhost:3000/`
4. ✅ Frontend files có `/website/` trong path
5. ✅ Dashboard files KHÔNG có `/website/` trong path

**Giờ bạn có thể truy cập hệ thống mà không gặp lỗi "Cannot GET"!**
