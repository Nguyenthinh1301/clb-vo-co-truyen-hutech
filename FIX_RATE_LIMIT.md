# Fix Lỗi "Quá nhiều yêu cầu từ IP này"

## 🐛 Nguyên Nhân

Lỗi này xảy ra do rate limiting trong backend. Backend đang giới hạn số lần đăng nhập thất bại để bảo vệ khỏi brute force attacks.

## ✅ Đã Fix

Đã tăng rate limit từ 100 lên 1000 requests trong 15 phút trong file `backend/server.js`.

## 🔧 Cách Khắc Phục

### Cách 1: Restart Backend (Khuyến nghị)

1. **Dừng backend hiện tại:**
   - Nhấn `Ctrl + C` trong terminal đang chạy backend
   - Hoặc tìm process và kill:
   ```powershell
   # Tìm process
   Get-Process -Name node
   
   # Kill process (thay <PID> bằng ID thực tế)
   Stop-Process -Id <PID> -Force
   ```

2. **Khởi động lại backend:**
   ```bash
   cd backend
   npm start
   ```

3. **Thử đăng nhập lại:**
   - URL: http://localhost:3000/website/views/account/dang-nhap.html
   - Email: user@hutech.edu.vn
   - Password: user123

### Cách 2: Đợi 15 Phút

Rate limit sẽ tự động reset sau 15 phút. Bạn có thể đợi và thử lại sau.

### Cách 3: Xóa Rate Limit Cache (Nếu cách 1 không work)

```bash
cd backend
node clear-rate-limit.js
npm start
```

## 📊 Cấu Hình Rate Limit Mới

```javascript
// Login Rate Limit
- Window: 15 phút
- Max requests: 1000 (tăng từ 100)
- Chỉ đếm requests THẤT BẠI
- Requests thành công KHÔNG bị đếm
```

## 🔍 Kiểm Tra Rate Limit

### Xem Backend Logs

Khi đăng nhập, backend sẽ log:
```
POST /api/auth/login 200 - Login successful
POST /api/auth/login 401 - Login failed (đếm vào rate limit)
POST /api/auth/login 429 - Too many requests (bị block)
```

### Kiểm Tra Headers

Mở Developer Tools (F12) → Network tab → Click vào request `/api/auth/login`:

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: <timestamp>
```

## 💡 Tips Tránh Bị Rate Limit

1. **Đảm bảo thông tin đăng nhập đúng:**
   - Email: user@hutech.edu.vn
   - Password: user123

2. **Không spam nút đăng nhập:**
   - Đợi response trước khi click lại

3. **Clear browser cache nếu cần:**
   - Ctrl + Shift + R (hoặc Cmd + Shift + R)

4. **Kiểm tra backend đang chạy:**
   ```powershell
   Get-NetTCPConnection -LocalPort 3000
   ```

## 🚨 Nếu Vẫn Bị Lỗi

### 1. Kiểm tra backend có đang chạy không

```powershell
Get-Process -Name node
```

Nếu không có process nào, start backend:
```bash
cd backend
npm start
```

### 2. Kiểm tra port 3000 có bị chiếm không

```powershell
Get-NetTCPConnection -LocalPort 3000
```

Nếu có process khác đang dùng port 3000, kill nó:
```powershell
# Tìm PID
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Kill process
Stop-Process -Id <PID> -Force
```

### 3. Kiểm tra SQL Server

```powershell
Get-Service MSSQL$SQLEXPRESS
```

Nếu stopped, start nó:
```powershell
Start-Service MSSQL$SQLEXPRESS
```

### 4. Xem backend logs chi tiết

Trong terminal đang chạy backend, xem có lỗi gì không:
- Database connection errors
- Authentication errors
- Rate limit errors

## 📝 Lưu Ý Quan Trọng

### Rate Limit Chỉ Đếm Failed Requests

```javascript
skipSuccessfulRequests: true
```

Nghĩa là:
- ✅ Đăng nhập thành công → KHÔNG đếm
- ❌ Đăng nhập thất bại → ĐẾM
- ❌ Sai email/password → ĐẾM

### Rate Limit Theo IP

Rate limit được tính theo IP address. Nếu nhiều người dùng cùng IP (cùng mạng), sẽ share chung limit.

### Development vs Production

**Development (hiện tại):**
- Max: 1000 requests/15 phút
- Rất nới lỏng để test

**Production (khuyến nghị):**
- Max: 5-10 requests/15 phút
- Chặt chẽ hơn để bảo vệ

## 🎯 Kết Luận

Sau khi restart backend với cấu hình mới:
- ✅ Rate limit đã tăng lên 1000 requests
- ✅ Chỉ đếm failed requests
- ✅ Có thể đăng nhập bình thường

Nếu vẫn gặp vấn đề, hãy:
1. Restart backend
2. Clear browser cache
3. Kiểm tra thông tin đăng nhập đúng
4. Xem backend logs để debug
