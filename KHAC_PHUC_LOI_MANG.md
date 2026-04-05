# 🔧 Khắc phục lỗi kết nối mạng

## 🚨 Vấn đề
Người dùng gặp lỗi "Lỗi kết nối mạng" khi đăng nhập vào hệ thống.

## 🔍 Nguyên nhân có thể
1. Backend server chưa được khởi động
2. Frontend không thể kết nối với backend API
3. Cấu hình API endpoint không đúng
4. Firewall hoặc antivirus chặn kết nối
5. Port bị xung đột

## ✅ Các bước khắc phục

### Bước 1: Kiểm tra Backend Server
```bash
# Kiểm tra backend có đang chạy không
netstat -an | findstr :5000

# Hoặc kiểm tra process
tasklist | findstr node
```

### Bước 2: Khởi động lại hệ thống
```bash
# Chạy script khởi động
.\start-system.ps1
```

### Bước 3: Kiểm tra kết nối API
Mở browser và truy cập:
- http://localhost:5000/api/health
- http://localhost:5000/api/auth/test

### Bước 4: Kiểm tra cấu hình
Kiểm tra file config API có đúng không.

---

**Đang tiến hành khắc phục...**