# 🔧 Hướng dẫn khắc phục lỗi đăng nhập

## ❌ Vấn đề: Không thể kết nối đến máy chủ

### Triệu chứng
- Thông báo lỗi: "Không thể kết nối đến máy chủ"
- Không thể đăng nhập dù nhập đúng thông tin
- Trang đăng nhập bị lặp lại

---

## ✅ Giải pháp

### 1. Kiểm tra Backend có đang chạy không

#### Cách 1: Sử dụng công cụ kiểm tra
1. Mở file: `website/test-backend-connection.html` trong trình duyệt
2. Nhấn nút "Kiểm tra kết nối"
3. Xem kết quả:
   - ✅ **Thành công**: Backend đang chạy bình thường
   - ❌ **Thất bại**: Cần khởi động backend

#### Cách 2: Kiểm tra thủ công
1. Mở trình duyệt
2. Truy cập: http://localhost:3000/health
3. Nếu thấy JSON response → Backend đang chạy
4. Nếu không kết nối được → Cần khởi động backend

---

### 2. Khởi động Backend

#### Trên Windows (PowerShell/CMD):
```powershell
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies (chỉ lần đầu)
npm install

# Khởi động server
npm start
```

#### Trên Linux/Mac:
```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies (chỉ lần đầu)
npm install

# Khởi động server
npm start
```

#### Sử dụng script tự động:
```powershell
# Windows
.\start-system.ps1

# Linux/Mac
./start-system.sh
```

**Chờ thông báo:**
```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3000
```

---

### 3. Kiểm tra Database

Backend cần kết nối đến SQL Server. Đảm bảo:

1. **SQL Server đang chạy**
   - Mở SQL Server Management Studio (SSMS)
   - Kết nối đến `localhost\SQLEXPRESS`

2. **Database tồn tại**
   - Database name: `clb_vo_co_truyen_hutech`
   - Nếu chưa có, chạy script tạo database

3. **Thông tin đăng nhập đúng**
   - Kiểm tra file `backend/.env`:
     ```
     MSSQL_SERVER=localhost\\SQLEXPRESS
     MSSQL_DATABASE=clb_vo_co_truyen_hutech
     MSSQL_USER=clb_admin
     MSSQL_PASSWORD=CLB@Hutech2026!
     ```

---

### 4. Kiểm tra Firewall/Antivirus

Nếu vẫn không kết nối được:

1. **Tắt tạm thời Windows Firewall**
   - Mở Windows Security
   - Firewall & network protection
   - Tắt tạm thời để test

2. **Tắt tạm thời Antivirus**
   - Một số antivirus chặn kết nối localhost
   - Tắt tạm thời để test

3. **Thêm exception cho Node.js**
   - Thêm `node.exe` vào danh sách cho phép của firewall

---

### 5. Xóa cache và thử lại

1. **Xóa localStorage**
   ```javascript
   // Mở Console trong trình duyệt (F12)
   localStorage.clear();
   location.reload();
   ```

2. **Xóa cookies**
   - Ctrl + Shift + Delete
   - Chọn "Cookies and other site data"
   - Clear data

3. **Hard refresh**
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

---

### 6. Kiểm tra Port 3000

Port 3000 có thể bị chiếm bởi ứng dụng khác:

#### Windows:
```powershell
# Kiểm tra port 3000
netstat -ano | findstr :3000

# Nếu bị chiếm, kill process
taskkill /PID <PID> /F
```

#### Linux/Mac:
```bash
# Kiểm tra port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

### 7. Thay đổi Port (nếu cần)

Nếu port 3000 không khả dụng:

1. **Sửa backend/.env**
   ```
   PORT=3001
   ```

2. **Sửa website/config/api-config.js**
   ```javascript
   const API_CONFIG = {
       BASE_URL: 'http://localhost:3001',
       // ...
   };
   ```

3. **Khởi động lại backend**

---

## 🔐 Vấn đề: Đăng nhập bị lặp lại

### Nguyên nhân
- Đã đăng nhập nhưng trang vẫn cho đăng nhập lại
- Session không được lưu đúng

### Giải pháp

1. **Xóa dữ liệu cũ**
   ```javascript
   // Mở Console (F12)
   localStorage.removeItem('currentUser');
   localStorage.removeItem('authToken');
   localStorage.removeItem('refreshToken');
   location.reload();
   ```

2. **Kiểm tra token**
   - Token có thể đã hết hạn
   - Đăng nhập lại để lấy token mới

3. **Đã được sửa**
   - File `dang-nhap.html` đã được cập nhật
   - Tự động redirect nếu đã đăng nhập
   - Không hiển thị thông báo gây lặp

---

## 🚫 Vấn đề: Rate Limiting (Quá nhiều lần thử)

### Triệu chứng
- Thông báo: "Quá nhiều lần đăng nhập thất bại"
- Phải đợi 15 phút

### Giải pháp

1. **Đợi hết thời gian**
   - Hệ thống tự động reset sau 15 phút
   - Đếm ngược hiển thị trên nút đăng nhập

2. **Xóa rate limit (development)**
   ```javascript
   // Mở Console (F12)
   Object.keys(localStorage)
       .filter(key => key.startsWith('login_attempts_'))
       .forEach(key => localStorage.removeItem(key));
   ```

3. **Tắt rate limiting (development)**
   - File `backend/server.js` đã được cấu hình
   - Rate limit nới lỏng trong development mode

---

## 📝 Tài khoản Demo

Sử dụng các tài khoản sau để test:

### Admin
- **Email**: admin@hutech.edu.vn
- **Password**: admin123

### Member
- **Email**: member@hutech.edu.vn
- **Password**: member123

### Demo
- **Email**: demo@test.com
- **Password**: 123456

---

## 🆘 Vẫn không được?

### Kiểm tra logs

1. **Backend logs**
   - Xem terminal đang chạy backend
   - Tìm lỗi màu đỏ

2. **Browser console**
   - F12 → Console tab
   - Xem lỗi JavaScript

3. **Network tab**
   - F12 → Network tab
   - Xem request/response
   - Kiểm tra status code

### Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp thông tin:
- Screenshot lỗi
- Backend logs
- Browser console logs
- Các bước đã thử

---

## ✨ Checklist khắc phục nhanh

- [ ] Backend đang chạy (http://localhost:3000/health)
- [ ] SQL Server đang chạy
- [ ] Database tồn tại
- [ ] Port 3000 không bị chiếm
- [ ] Firewall/Antivirus không chặn
- [ ] Đã xóa cache/localStorage
- [ ] Đã thử tài khoản demo
- [ ] Đã kiểm tra console logs

---

**Cập nhật lần cuối**: 2026-02-18
**Phiên bản**: 1.0.0
