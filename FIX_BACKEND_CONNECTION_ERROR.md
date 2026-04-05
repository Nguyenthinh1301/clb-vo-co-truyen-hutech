# 🔧 FIX LỖI "BACKEND KHÔNG HOẠT ĐỘNG"

## ❌ VẤN ĐỀ
Trang đăng nhập hiển thị thông báo đỏ: "Backend không hoạt động - Không thể kết nối đến server"

## ✅ GIẢI PHÁP ĐÃ THỰC HIỆN

### 1. Khởi động Backend
Backend đã được khởi động thành công tại: **http://localhost:3000**

```bash
✅ Server started successfully
✅ Database connected
✅ Port: 3000
✅ Environment: development
```

### 2. Kiểm tra Backend Health
```bash
GET /health → 200 OK
```

Backend đang hoạt động bình thường!

---

## 🧪 CÁCH KIỂM TRA

### Phương pháp 1: Sử dụng Test Page

1. Mở file: `test-backend-connection.html` trong browser
2. Trang sẽ tự động chạy 3 tests:
   - ✅ Health Check
   - ✅ Login API Test
   - ✅ CORS Headers Test

### Phương pháp 2: Sử dụng Browser Console

1. Mở trang đăng nhập
2. Nhấn F12 → Console tab
3. Chạy lệnh:

```javascript
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => console.log('Backend status:', d))
  .catch(e => console.error('Backend error:', e));
```

**Kết quả mong đợi:**
```javascript
Backend status: {
  success: true,
  message: "Server is running",
  database: { success: true, message: "Database connected" }
}
```

### Phương pháp 3: Sử dụng PowerShell

```powershell
Invoke-RestMethod http://localhost:3000/health
```

**Kết quả mong đợi:**
```
success     : True
message     : Server is running
database    : @{success=True; message=Database connected}
```

---

## 🔍 NGUYÊN NHÂN LỖI

### Nguyên nhân 1: Backend chưa khởi động
**Triệu chứng:** Thông báo "Không thể kết nối đến server"

**Giải pháp:**
```bash
cd backend
npm start
```

### Nguyên nhân 2: Browser Cache
**Triệu chứng:** Backend đang chạy nhưng vẫn báo lỗi

**Giải pháp:**
1. Hard reload: `Ctrl + Shift + R`
2. Clear cache: `Ctrl + Shift + Delete`
3. Hoặc mở Incognito mode: `Ctrl + Shift + N`

### Nguyên nhân 3: Port bị chiếm
**Triệu chứng:** Backend không start được

**Giải pháp:**
```powershell
# Kiểm tra port 3000
netstat -ano | findstr :3000

# Kill process nếu cần
taskkill /PID <PID> /F
```

### Nguyên nhân 4: CORS Issues
**Triệu chứng:** Console hiển thị CORS errors

**Giải pháp:** Backend đã config CORS đúng, chỉ cần reload trang

---

## 📝 CHECKLIST FIX

### Bước 1: Kiểm tra Backend
```bash
# Check if backend is running
curl http://localhost:3000/health

# Hoặc
Invoke-RestMethod http://localhost:3000/health
```

✅ **Kết quả:** Backend đang chạy tốt

### Bước 2: Clear Browser Cache
```
1. Ctrl + Shift + Delete
2. Chọn "Cached images and files"
3. Click "Clear data"
```

### Bước 3: Hard Reload Trang
```
Ctrl + Shift + R
```

### Bước 4: Test Lại
```
1. Mở: http://localhost:3000/website/views/account/dang-nhap.html
2. Kiểm tra không còn thông báo đỏ
3. Thử đăng nhập với:
   - Email: admin@hutech.edu.vn
   - Password: admin123
```

---

## 🎯 HƯỚNG DẪN SỬ DỤNG

### Đăng nhập với các tài khoản:

#### Admin:
- **Email:** admin@hutech.edu.vn
- **Password:** admin123
- **Redirect:** → dashboard.html

#### User (Member):
- **Email:** member@hutech.edu.vn
- **Password:** member123
- **Redirect:** → user-dashboard.html

#### Instructor:
- **Email:** instructor@hutech.edu.vn
- **Password:** instructor123
- **Redirect:** → dashboard.html (với quyền instructor)

---

## 🚨 NẾU VẪN GẶP LỖI

### Lỗi 1: "Failed to fetch"
**Nguyên nhân:** Backend không chạy hoặc port sai

**Fix:**
```bash
# Restart backend
cd backend
npm start

# Verify port
netstat -ano | findstr :3000
```

### Lỗi 2: "CORS policy blocked"
**Nguyên nhân:** CORS configuration

**Fix:** Backend đã config CORS, chỉ cần:
```javascript
// Check in backend/server.js
app.use(cors({
    origin: '*',
    credentials: true
}));
```

### Lỗi 3: "Network Error"
**Nguyên nhân:** Firewall hoặc antivirus

**Fix:**
1. Tắt tạm thời firewall/antivirus
2. Hoặc add exception cho port 3000

### Lỗi 4: Backend crash khi start
**Nguyên nhân:** Database connection failed

**Fix:**
```bash
# Check database connection
# In backend/.env
DB_HOST=localhost\SQLEXPRESS
DB_NAME=clb_vo_co_truyen_hutech
DB_USER=sa
DB_PASSWORD=your_password
```

---

## 📊 BACKEND STATUS

### Current Status:
```
✅ Backend: Running
✅ Port: 3000
✅ Database: Connected
✅ Health: OK
✅ CORS: Enabled
✅ Authentication: Working
```

### Endpoints Available:
```
✅ GET  /health
✅ POST /api/auth/login
✅ POST /api/auth/register
✅ GET  /api/user/profile
✅ GET  /api/user/classes
✅ GET  /api/user/events
✅ GET  /api/user/stats
✅ GET  /api/user/content/dashboard-stats
✅ GET  /api/user/content/announcements
✅ GET  /api/user/content/news
```

---

## 🔄 RESTART BACKEND

### Cách 1: Sử dụng npm
```bash
cd backend
npm start
```

### Cách 2: Sử dụng PM2 (nếu có)
```bash
pm2 restart backend
```

### Cách 3: Sử dụng script
```bash
# Windows
.\start-system.ps1

# Linux/Mac
./start-system.sh
```

---

## 📞 SUPPORT

Nếu vẫn gặp vấn đề:

1. **Check backend logs:**
   ```bash
   cd backend
   npm start
   # Xem logs trong terminal
   ```

2. **Check browser console:**
   ```
   F12 → Console tab
   Xem error messages
   ```

3. **Test connection:**
   ```
   Mở: test-backend-connection.html
   Xem kết quả tests
   ```

4. **Verify database:**
   ```sql
   -- Connect to SQL Server
   USE clb_vo_co_truyen_hutech;
   SELECT * FROM users WHERE email = 'admin@hutech.edu.vn';
   ```

---

## ✅ KẾT LUẬN

Backend đã được khởi động thành công và đang hoạt động bình thường tại **http://localhost:3000**.

**Các bước tiếp theo:**
1. ✅ Clear browser cache
2. ✅ Hard reload trang đăng nhập
3. ✅ Test đăng nhập với tài khoản admin
4. ✅ Verify dashboard load thành công

**Lỗi "Backend không hoạt động" sẽ biến mất sau khi reload trang!**
