# 🔧 Khắc phục lỗi Backend Offline

## ❌ Vấn đề

Khi đăng nhập hoặc đăng ký, bạn gặp thông báo:
```
❌ Không thể kết nối đến máy chủ. Vui lòng kiểm tra:
- Kết nối internet
- Máy chủ backend đang chạy (http://localhost:3000)
- Tường lửa hoặc antivirus không chặn kết nối
```

## ✅ Giải pháp đã cải thiện

### 1. Tự động kiểm tra Backend

Hệ thống đã được cập nhật với:

✅ **Auto-retry**: Tự động thử lại 2 lần khi gặp lỗi network  
✅ **Backend Checker**: Tự động kiểm tra backend mỗi 30 giây  
✅ **Thông báo thông minh**: Hiển thị thông báo khi backend offline/online  
✅ **Nút thử lại**: Click để kiểm tra lại ngay lập tức  

### 2. Khởi động Backend

#### Cách 1: Sử dụng Terminal/CMD

```powershell
# Windows PowerShell
cd backend
npm start
```

```bash
# Linux/Mac
cd backend
npm start
```

#### Cách 2: Sử dụng Script tự động

```powershell
# Windows
.\start-system.ps1
```

```bash
# Linux/Mac
./start-system.sh
```

#### Cách 3: Sử dụng PM2 (Production)

```powershell
cd backend
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs
```

### 3. Kiểm tra Backend đang chạy

#### Cách 1: Sử dụng trình duyệt
Mở: http://localhost:3000/health

Nếu thấy JSON response → Backend OK ✅

#### Cách 2: Sử dụng công cụ kiểm tra
Mở file: `website/test-backend-connection.html`

#### Cách 3: Sử dụng PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health
```

## 🎯 Tính năng mới

### Backend Checker

Tự động kiểm tra backend và hiển thị thông báo:

**Khi backend offline:**
- Hiển thị thông báo đỏ ở góc phải màn hình
- Hướng dẫn khởi động backend
- Nút "Thử lại" để kiểm tra ngay

**Khi backend online:**
- Hiển thị thông báo xanh
- Tự động ẩn sau 3 giây

**Tự động monitoring:**
- Kiểm tra mỗi 30 giây
- Thông báo khi backend vừa offline/online

### Auto-retry

Khi đăng nhập/đăng ký:
- Tự động thử lại 2 lần nếu gặp lỗi network
- Delay 1-2 giây giữa các lần thử
- Chỉ retry với network errors, không retry với authentication errors

## 🔍 Troubleshooting

### Lỗi: Port 3000 đã được sử dụng

```powershell
# Kiểm tra process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process (thay <PID> bằng số PID từ lệnh trên)
taskkill /PID <PID> /F

# Khởi động lại backend
cd backend
npm start
```

### Lỗi: Module not found

```powershell
cd backend
npm install
npm start
```

### Lỗi: Database connection failed

1. Kiểm tra SQL Server đang chạy
2. Kiểm tra thông tin trong `backend/.env`:
```
MSSQL_SERVER=localhost\\SQLEXPRESS
MSSQL_DATABASE=clb_vo_co_truyen_hutech
MSSQL_USER=clb_admin
MSSQL_PASSWORD=CLB@Hutech2026!
```

### Lỗi: Backend khởi động nhưng vẫn không kết nối được

1. **Kiểm tra firewall:**
   - Windows Defender Firewall
   - Antivirus software
   - Thêm exception cho Node.js

2. **Kiểm tra URL:**
   - File `website/config/api-config.js`
   - Đảm bảo `BASE_URL: 'http://localhost:3000'`

3. **Clear cache:**
   - Ctrl + Shift + Delete
   - Clear cookies and cache
   - Hard refresh: Ctrl + Shift + R

## 📝 Checklist khắc phục

- [ ] Backend đang chạy (http://localhost:3000/health trả về 200)
- [ ] Port 3000 không bị chiếm bởi process khác
- [ ] SQL Server đang chạy
- [ ] Database tồn tại và kết nối được
- [ ] Firewall/Antivirus không chặn
- [ ] Browser cache đã được clear
- [ ] Đã thử hard refresh (Ctrl + Shift + R)

## 🚀 Khởi động nhanh

### Script một dòng (Windows)

```powershell
cd backend; npm start
```

### Kiểm tra nhanh

```powershell
# Kiểm tra backend
curl http://localhost:3000/health

# Nếu lỗi, khởi động
cd backend; npm start
```

## 💡 Tips

### 1. Giữ Backend chạy liên tục

Sử dụng PM2 để backend tự động restart khi crash:

```powershell
cd backend
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 2. Tạo shortcut khởi động

**Windows:**
1. Tạo file `start-backend.bat`:
```batch
@echo off
cd /d "%~dp0backend"
npm start
pause
```

2. Double-click để chạy

**Linux/Mac:**
1. Tạo file `start-backend.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")/backend"
npm start
```

2. Chmod và chạy:
```bash
chmod +x start-backend.sh
./start-backend.sh
```

### 3. Auto-start khi boot (Windows)

1. Tạo shortcut của `start-backend.bat`
2. Copy vào: `C:\Users\<YourName>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`

## 📊 Monitoring

### Xem logs backend

```powershell
# Nếu dùng npm start
# Logs hiển thị trực tiếp trong terminal

# Nếu dùng PM2
pm2 logs
```

### Kiểm tra status

```powershell
# PM2
pm2 status

# Hoặc check health endpoint
curl http://localhost:3000/health
```

## 🔐 Security Notes

- Backend chỉ nên chạy trên localhost trong development
- Không expose port 3000 ra internet
- Sử dụng environment variables cho sensitive data
- Enable HTTPS trong production

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề:

1. **Kiểm tra console logs:**
   - Browser: F12 → Console
   - Backend: Terminal đang chạy npm start

2. **Cung cấp thông tin:**
   - Screenshot lỗi
   - Backend logs
   - Browser console logs
   - File `.env` (ẩn password)

3. **Xem thêm:**
   - `HUONG_DAN_KHAC_PHUC_LOI_DANG_NHAP.md`
   - `KHOI_DONG_BACKEND.md`
   - `ADMIN_USER_SYNC_COMPLETE.md`

## ✨ Cải tiến trong phiên bản này

- ✅ Auto-retry khi network error
- ✅ Backend health checker tự động
- ✅ Thông báo thông minh
- ✅ Nút thử lại nhanh
- ✅ Monitoring mỗi 30 giây
- ✅ Hướng dẫn chi tiết trong notification

---

**Cập nhật**: 2026-02-18  
**Phiên bản**: 2.0.0  
**Status**: ✅ Đã cải thiện
