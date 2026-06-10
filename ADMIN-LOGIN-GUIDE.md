# 🔐 Hướng Dẫn Đăng Nhập Admin

## 📋 Thông Tin Đăng Nhập

### Tài Khoản Admin
- **Email:** `admin@vocotruyenhutech.edu.vn`
- **Username:** `admin_vct`
- **Password:** `Admin@123`
- **Role:** `admin`

### URLs
- **Local Admin Panel:** http://localhost:5505/website/admin/index.html
- **Local Backend API:** http://localhost:3001/api
- **Production Admin:** https://vocotruyenhutech.netlify.app/admin
- **Production Backend:** https://clb-vo-co-truyen-hutech.onrender.com/api

---

## 🚀 Khởi Động Môi Trường Local

### 1. Khởi động Backend
```powershell
# Từ thư mục root của project
cd backend
npm start
```

Hoặc dùng script:
```powershell
.\scripts\restart-backend.ps1
```

**Kiểm tra backend đã chạy:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

### 2. Khởi động Frontend
- Mở **website/admin/index.html** bằng Live Server (VS Code)
- Hoặc mở **website/index.html** và click vào link "Admin"

---

## 🔧 Xử Lý Lỗi "Không kết nối được backend"

### Nguyên nhân thường gặp:

#### 1. Backend chưa khởi động
**Triệu chứng:** Lỗi "Không kết nối được backend. Hãy chắc backend đang chạy."

**Giải pháp:**
```powershell
# Kiểm tra backend
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Nếu lỗi, khởi động lại backend
cd backend
npm start
```

#### 2. CORS Error
**Triệu chứng:** Console (F12) hiện lỗi CORS policy

**Giải pháp:**
- Kiểm tra port của Live Server (thường là 5500, 5501, 5505)
- Đảm bảo port có trong `backend/.env`:
  ```
  CORS_ORIGIN=http://localhost:3000,...,http://localhost:5505,...
  ```
- Nếu dùng port khác, thêm vào CORS_ORIGIN
- Restart backend sau khi sửa .env

#### 3. Browser Cache
**Triệu chứng:** Trang vẫn dùng config cũ dù đã sửa code

**Giải pháp:**
- Hard refresh: `Ctrl + F5` (Windows) hoặc `Cmd + Shift + R` (Mac)
- Xóa cache: `Ctrl + Shift + Delete` > Clear browsing data
- Mở Incognito/Private window để test

#### 4. Sai mật khẩu
**Triệu chứng:** "Sai email hoặc mật khẩu" hoặc "Tài khoản không có quyền Admin"

**Giải pháp:**
```powershell
# Reset mật khẩu admin về Admin@123
cd backend
node scripts/create-admin.js
```

---

## 🧪 Test Kết Nối

### Test Script Tự Động
Mở trong browser:
```
website/test-backend-connection.html
```

Script này sẽ:
- ✅ Kiểm tra backend health
- ✅ Kiểm tra CORS headers
- ✅ Test auth endpoint
- ✅ Test login với credentials

### Test Thủ Công

#### 1. Test Backend Health
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Server is running",
  "environment": "development",
  "database": {
    "success": true,
    "message": "Database connected"
  }
}
```

#### 2. Test Admin Login API
```powershell
$body = @{
    email = 'admin@vocotruyenhutech.edu.vn'
    password = 'Admin@123'
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@vocotruyenhutech.edu.vn",
      "role": "admin",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 🔄 Reset Mật Khẩu Admin

Nếu quên mật khẩu hoặc cần reset:

```powershell
cd backend
node scripts/create-admin.js
```

Script sẽ:
1. Tìm tài khoản admin hiện có
2. Reset mật khẩu về `Admin@123`
3. Đảm bảo role = `admin` và status = `active`

**Output:**
```
✅ Đã reset mật khẩu thành công!

📋 Thông tin đăng nhập:
   Email: admin@vocotruyenhutech.edu.vn
   Password: Admin@123
```

---

## 📱 Đăng Nhập Production

### Admin Panel Production
**URL:** https://vocotruyenhutech.netlify.app/admin

**Lưu ý:**
- Tài khoản admin production có thể khác local
- Mật khẩu production nên khác với mật khẩu development
- Kiểm tra Render backend logs nếu gặp lỗi

### Kiểm tra Production Backend
```powershell
Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/health"
```

### Test Production Login
```powershell
$body = @{
    email = 'admin@vocotruyenhutech.edu.vn'
    password = 'Admin@123'
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 🛠️ Scripts Hữu Ích

### Restart Backend
```powershell
.\scripts\restart-backend.ps1
```

### Test Production Contact
```powershell
.\scripts\test-production-contact.ps1
```

### Create/Reset Admin
```powershell
cd backend
node scripts/create-admin.js
```

---

## 🐛 Troubleshooting Checklist

- [ ] Backend đang chạy? (`http://localhost:3001/health` trả về 200)
- [ ] Database kết nối được? (backend logs không có database errors)
- [ ] Live Server đang chạy? (website mở được trong browser)
- [ ] Port của Live Server có trong CORS_ORIGIN? (kiểm tra `backend/.env`)
- [ ] Browser cache đã xóa? (Ctrl+F5 hoặc Ctrl+Shift+Delete)
- [ ] Mật khẩu đúng? (Admin@123)
- [ ] Console có lỗi gì? (F12 > Console tab)
- [ ] Network tab có request failed? (F12 > Network tab)

---

## 📞 Support

Nếu vẫn gặp vấn đề:

1. **Check backend logs** - Xem terminal đang chạy `npm start`
2. **Check browser console** - F12 > Console tab
3. **Check network requests** - F12 > Network tab
4. **Run test script** - Mở `website/test-backend-connection.html`
5. **Reset everything:**
   ```powershell
   # Stop backend (Ctrl+C trong terminal backend)
   # Xóa node_modules cache (optional)
   cd backend
   rm -rf node_modules/.cache
   
   # Restart backend
   npm start
   
   # Hard refresh browser (Ctrl+F5)
   ```

---

**Last Updated:** 10/06/2026
