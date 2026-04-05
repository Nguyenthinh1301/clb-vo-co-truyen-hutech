# 🚀 Quick Start Guide - CLB Võ Cổ Truyền HUTECH Backend

## ⚡ Khởi động nhanh trong 5 phút

---

## Bước 1: Khởi động MySQL Server

### Cách 1: WAMP (Khuyến nghị - Dễ nhất)

1. **Tìm WAMP icon** trên taskbar (góc dưới bên phải màn hình)
2. **Click chuột phải** vào icon WAMP
3. Chọn **"Start All Services"** hoặc **"Restart All Services"**
4. Đợi icon chuyển sang **màu xanh** (có thể mất 10-30 giây)
5. Nếu icon vẫn màu đỏ/vàng:
   - Click chuột phải → MySQL → Service → Start/Resume Service

### Cách 2: Command Line (Cần quyền Administrator)

```powershell
# Mở PowerShell as Administrator (chuột phải → Run as Administrator)
Start-Service wampmysqld64

# Kiểm tra status
Get-Service wampmysqld64
```

### Cách 3: WAMP Manager

1. Mở **WAMP Server Manager** từ Start Menu
2. Click **"Start All Services"**
3. Đợi services khởi động

---

## Bước 2: Kiểm tra MySQL đã chạy chưa

```bash
cd backend
node scripts/check-mysql.js
```

**Kết quả mong đợi:**
```
✅ MySQL Connection Successful!
```

**Nếu thấy lỗi:**
- Quay lại Bước 1 và đảm bảo MySQL đã chạy
- Kiểm tra WAMP icon phải màu xanh

---

## Bước 3: Tạo Database

```bash
# Vẫn trong thư mục backend
npm run init-db
```

**Script này sẽ:**
- Tạo database `clb_vo_co_truyen_hutech`
- Tạo 12 tables
- Insert dữ liệu mẫu (seed data)
- Tạo tài khoản admin mặc định

**Tài khoản admin mặc định:**
- Email: `admin@vocotruyenhutech.edu.vn`
- Password: `admin123456`

---

## Bước 4: Khởi động Backend Server

```bash
# Development mode (auto-reload)
npm run dev

# Hoặc production mode
npm start
```

**Server sẽ chạy tại:**
- API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/health

---

## Bước 5: Test API

### Test bằng Browser:

1. **Health Check:**
   ```
   http://localhost:3000/health
   ```

2. **API Documentation:**
   ```
   http://localhost:3000/api-docs
   ```

### Test bằng cURL:

```bash
# Health check
curl http://localhost:3000/health

# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\",\"full_name\":\"Test User\",\"phone\":\"0123456789\"}"

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@vocotruyenhutech.edu.vn\",\"password\":\"admin123456\"}"
```

---

## 🔧 Troubleshooting

### Lỗi: "MySQL Connection Failed"

**Nguyên nhân:** MySQL chưa chạy

**Giải pháp:**
1. Kiểm tra WAMP icon - phải màu xanh
2. Nếu màu đỏ/vàng: Click chuột phải → Start All Services
3. Nếu vẫn lỗi: Restart máy tính và thử lại

### Lỗi: "Port 3306 already in use"

**Nguyên nhân:** Có service khác đang dùng port 3306

**Giải pháp:**
```powershell
# Kiểm tra process nào đang dùng port 3306
netstat -ano | findstr :3306

# Hoặc đổi port trong .env
DB_PORT=3307
```

### Lỗi: "Access denied for user 'root'"

**Nguyên nhân:** Sai password MySQL

**Giải pháp:**
1. Mở file `.env` trong thư mục backend
2. Cập nhật password:
   ```
   DB_PASSWORD=your_mysql_password
   ```
3. Nếu không nhớ password, reset qua WAMP:
   - Click WAMP icon → MySQL → MySQL Console
   - Nhập password cũ hoặc để trống
   - Đổi password mới

### Lỗi: "Database already exists"

**Không phải lỗi!** Database đã được tạo rồi.

**Nếu muốn tạo lại:**
```bash
# Xóa database cũ (cẩn thận - mất hết dữ liệu!)
mysql -u root -p -e "DROP DATABASE IF EXISTS clb_vo_co_truyen_hutech;"

# Tạo lại
npm run init-db
```

### Lỗi: "Port 3000 already in use"

**Nguyên nhân:** Backend đang chạy rồi hoặc app khác dùng port 3000

**Giải pháp:**
```powershell
# Tìm và kill process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Hoặc đổi port trong .env
PORT=3001
```

---

## 📱 Kết nối Frontend

### Bước 1: Cập nhật API URL

Mở file `website/config/api-config.js`:

```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    TIMEOUT: 30000
};
```

### Bước 2: Test Frontend

1. Mở file `website/index.html` trong browser
2. Thử đăng ký tài khoản mới
3. Thử đăng nhập
4. Kiểm tra các tính năng

---

## 🎯 Các lệnh hữu ích

```bash
# Backend
npm run dev          # Chạy development mode
npm start            # Chạy production mode
npm test             # Chạy tests
npm run init-db      # Khởi tạo database
npm run pm2:start    # Chạy với PM2
npm run docker:run   # Chạy với Docker

# Database
node scripts/check-mysql.js    # Kiểm tra MySQL
mysql -u root -p               # Mở MySQL console

# Logs
tail -f logs/error.log         # Xem error logs
tail -f logs/combined.log      # Xem all logs
```

---

## 📊 Kiểm tra hệ thống

### Health Check Endpoints:

```bash
# Basic health
curl http://localhost:3000/health

# Detailed health (with system info)
curl http://localhost:3000/health/detailed

# Readiness check
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live
```

### Database Check:

```bash
# Kiểm tra kết nối
node scripts/check-mysql.js

# Kiểm tra tables
mysql -u root -p clb_vo_co_truyen_hutech -e "SHOW TABLES;"

# Đếm users
mysql -u root -p clb_vo_co_truyen_hutech -e "SELECT COUNT(*) FROM users;"
```

---

## 🎉 Hoàn thành!

Nếu tất cả các bước trên thành công, bạn đã có:

✅ MySQL server đang chạy  
✅ Database đã được tạo với 12 tables  
✅ Dữ liệu mẫu đã được insert  
✅ Backend API đang chạy tại port 3000  
✅ API documentation tại /api-docs  
✅ Tài khoản admin sẵn sàng sử dụng  

**Bước tiếp theo:**
- Đọc [API Documentation](http://localhost:3000/api-docs)
- Đọc [Features Documentation](./FEATURES.md)
- Đọc [Deployment Guide](./DEPLOYMENT.md)

---

## 📞 Cần trợ giúp?

- Kiểm tra [STATUS.md](./STATUS.md) - Tình trạng dự án
- Kiểm tra [README.md](./README.md) - Tài liệu chính
- Kiểm tra [FEATURES.md](./FEATURES.md) - Danh sách tính năng
- Kiểm tra logs trong thư mục `logs/`

---

**Chúc bạn code vui vẻ! 🚀**
