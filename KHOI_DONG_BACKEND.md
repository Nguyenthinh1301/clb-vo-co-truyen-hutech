# 🚀 Hướng dẫn khởi động Backend

## Cách nhanh nhất

### Windows (PowerShell):
```powershell
cd backend
npm start
```

### Linux/Mac:
```bash
cd backend
npm start
```

## Kiểm tra Backend đang chạy

Sau khi chạy lệnh trên, bạn sẽ thấy:

```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3000
🌍 Environment: development
📊 Health check: http://localhost:3000/health
📚 API Docs: http://localhost:3000/api-docs
🔌 WebSocket: Enabled
📡 API Version: v1
```

## Kiểm tra kết nối

### Cách 1: Sử dụng trình duyệt
Mở: `website/test-backend-connection.html`

### Cách 2: Truy cập trực tiếp
Mở trình duyệt và vào: http://localhost:3000/health

### Cách 3: Sử dụng PowerShell
```powershell
Invoke-WebRequest -Uri http://localhost:3000/health
```

## Lỗi thường gặp

### 1. Port 3000 đã được sử dụng

**Kiểm tra:**
```powershell
netstat -ano | findstr :3000
```

**Giải pháp:**
```powershell
# Tìm PID từ lệnh trên, sau đó:
taskkill /PID <PID> /F
```

### 2. Module không tìm thấy

**Giải pháp:**
```powershell
cd backend
npm install
npm start
```

### 3. Database không kết nối được

**Kiểm tra:**
- SQL Server đang chạy
- Database `clb_vo_co_truyen_hutech` tồn tại
- Thông tin đăng nhập trong `.env` đúng

**Xem log:**
Backend sẽ hiển thị lỗi database trong console

### 4. Lỗi EADDRINUSE

Port 3000 đang được sử dụng bởi process khác.

**Giải pháp 1: Kill process**
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Giải pháp 2: Đổi port**
Sửa file `backend/.env`:
```
PORT=3001
```

Sau đó cập nhật `website/config/api-config.js`:
```javascript
BASE_URL: 'http://localhost:3001'
```

## Dừng Backend

Nhấn `Ctrl + C` trong terminal đang chạy backend

## Chạy Backend ở chế độ nền (Production)

### Sử dụng PM2:
```powershell
cd backend
npm install -g pm2
pm2 start ecosystem.config.js
pm2 logs
```

### Dừng PM2:
```powershell
pm2 stop all
pm2 delete all
```

## Script tự động

Sử dụng script có sẵn:

### Windows:
```powershell
.\start-system.ps1
```

### Linux/Mac:
```bash
./start-system.sh
```

## Kiểm tra nhanh

Sau khi khởi động backend, test ngay:

1. Mở `website/test-backend-connection.html`
2. Nhấn "Kiểm tra kết nối"
3. Nếu thấy ✅ → Backend OK
4. Nếu thấy ❌ → Xem hướng dẫn khắc phục

## Logs và Debug

### Xem logs:
Backend sẽ in logs ra console. Để xem chi tiết:

```powershell
# Trong thư mục backend
npm start
```

### Debug mode:
Sửa `.env`:
```
NODE_ENV=development
```

## Cấu hình quan trọng

File `backend/.env`:
```
PORT=3000
HOST=localhost
DB_TYPE=mssql
MSSQL_SERVER=localhost\\SQLEXPRESS
MSSQL_DATABASE=clb_vo_co_truyen_hutech
```

## Liên hệ

Nếu vẫn gặp vấn đề, cung cấp:
- Screenshot lỗi
- Nội dung console
- File `.env` (ẩn password)
