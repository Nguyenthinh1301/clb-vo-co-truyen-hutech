# 🥋 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG CLB VÕ CỔ TRUYỀN HUTECH

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống quản lý CLB Võ Cổ Truyền HUTECH đã được hoàn thiện với đầy đủ tính năng cho cả người dùng thường và quản trị viên.

### 🎯 TÍNH NĂNG CHÍNH

#### 👤 **Dành cho Người dùng thường (Student/Instructor)**
- ✅ Đăng ký/Đăng nhập tài khoản
- ✅ Xem thông tin cá nhân
- ✅ Xem lớp học đang tham gia
- ✅ Nhận thông báo từ Admin
- ✅ Xem tiến độ học tập
- ✅ Cập nhật hồ sơ cá nhân

#### 🛡️ **Dành cho Quản trị viên (Admin)**
- ✅ Dashboard quản lý tổng quan
- ✅ Quản lý tất cả thành viên
- ✅ Chỉnh sửa thông tin thành viên
- ✅ Gửi thông báo cho từng thành viên
- ✅ Kích hoạt/Vô hiệu hóa tài khoản
- ✅ Xem thống kê hệ thống
- ✅ Quản lý lớp học và sự kiện

---

## 🚀 KHỞI ĐỘNG HỆ THỐNG

### 1. **Khởi động Backend**
```bash
cd backend
npm install
npm start
```
**Server sẽ chạy tại:** `http://localhost:3001`

### 2. **Khởi động Frontend**
```bash
cd website
# Mở file index.html bằng Live Server hoặc web server
```
**Website sẽ chạy tại:** `http://localhost:3000` (hoặc port khác)

### 3. **Kiểm tra hệ thống**
- **Health Check:** `http://localhost:3001/health`
- **API Documentation:** `http://localhost:3001/api-docs`
- **Test Dashboard:** `http://localhost:3000/test-integrated-dashboard.html`

---

## 👥 TÀI KHOẢN MẶC ĐỊNH

### 🛡️ **Admin Account**
```
Email: admin@hutech.edu.vn
Password: Admin123456
Role: admin
```

### 👤 **User Account**
```
Email: user@hutech.edu.vn  
Password: User123456
Role: student
```

### 👨‍🏫 **Instructor Account**
```
Email: instructor@hutech.edu.vn
Password: Instructor123456
Role: instructor
```

---

## 🎮 HƯỚNG DẪN SỬ DỤNG CHI TIẾT

### 📱 **1. ĐĂNG NHẬP VÀO HỆ THỐNG**

1. Truy cập website: `http://localhost:3000`
2. Click vào **"Thành viên"** trên menu
3. Chọn **"Đăng nhập"**
4. Nhập email và mật khẩu
5. Click **"Đăng nhập"**

### 👤 **2. DÀNH CHO NGƯỜI DÙNG THƯỜNG**

#### **Xem thông tin cá nhân:**
1. Sau khi đăng nhập, click vào tên của bạn trên menu
2. Chọn **"Thông tin cá nhân"**
3. Xem các thông tin:
   - Thông tin cá nhân
   - Lớp học đang tham gia
   - Tiến độ & Thành tích
   - Thông báo từ Admin

#### **Cập nhật hồ sơ:**
1. Trong trang thông tin cá nhân
2. Click **"Chỉnh sửa hồ sơ"**
3. Cập nhật thông tin cần thiết
4. Lưu thay đổi

### 🛡️ **3. DÀNH CHO QUẢN TRỊ VIÊN**

#### **Truy cập Admin Dashboard:**
1. Đăng nhập bằng tài khoản Admin
2. Click vào tên Admin trên menu
3. Chọn **"Admin Dashboard"**
4. Xem tổng quan hệ thống:
   - Số lượng thành viên
   - Số lớp học
   - Sự kiện sắp tới
   - Trạng thái hệ thống

#### **Quản lý thành viên:**
1. Trong Admin Dashboard, click **"Quản lý thành viên"**
2. Hoặc trong User Dashboard, click **"Quản lý thành viên"**
3. Các chức năng có sẵn:
   - **Tìm kiếm:** Nhập tên, email để tìm
   - **Chỉnh sửa:** Click nút "Sửa" trên thẻ thành viên
   - **Gửi thông báo:** Click nút "Thông báo"
   - **Kích hoạt/Tạm ngưng:** Click nút tương ứng

#### **Chỉnh sửa thông tin thành viên:**
1. Click nút **"Sửa"** trên thẻ thành viên
2. Cập nhật các thông tin:
   - Tên, họ
   - Số điện thoại
   - Ngày sinh, giới tính
   - Cấp độ võ thuật
   - Trạng thái thành viên
   - Ghi chú
3. Click **"Lưu thay đổi"**

#### **Gửi thông báo:**
1. Click nút **"Thông báo"** trên thẻ thành viên
2. Điền thông tin:
   - Tiêu đề thông báo
   - Nội dung chi tiết
   - Loại thông báo (Thông tin/Thành công/Cảnh báo/Lỗi)
   - Mức độ ưu tiên (Thấp/Trung bình/Cao/Khẩn cấp)
3. Click **"Gửi thông báo"**

---

## 🔧 TÍNH NĂNG NÂNG CAO

### 📊 **Dashboard Tích Hợp**
- **User Dashboard:** Hiển thị thông tin cá nhân cho người dùng thường
- **Admin Panel:** Chuyển đổi sang chế độ quản lý cho Admin
- **Tìm kiếm thông minh:** Tìm kiếm thành viên theo nhiều tiêu chí
- **Cập nhật thời gian thực:** Dữ liệu được cập nhật ngay lập tức

### 🔐 **Bảo mật**
- **JWT Authentication:** Xác thực bằng token
- **Role-based Access:** Phân quyền theo vai trò
- **Session Management:** Quản lý phiên đăng nhập
- **Rate Limiting:** Giới hạn số lượng request

### 📱 **Responsive Design**
- Tương thích với mọi thiết bị
- Giao diện thân thiện trên mobile
- Hiệu ứng mượt mà và chuyên nghiệp

---

## 🧪 KIỂM TRA HỆ THỐNG

### **Test Dashboard:**
1. Truy cập: `http://localhost:3000/test-integrated-dashboard.html`
2. Thực hiện các test:
   - **Xác thực:** Test đăng nhập/đăng xuất
   - **Dashboard:** Test truy cập dashboard
   - **Quản lý User:** Test các chức năng admin
   - **Lớp học:** Test API lớp học
   - **Thông báo:** Test hệ thống thông báo
   - **Sức khỏe hệ thống:** Test các API endpoint

### **API Testing:**
- **Postman Collection:** Import từ `/api-docs`
- **Swagger UI:** `http://localhost:3001/api-docs`
- **Health Check:** `http://localhost:3001/health`

---

## 📁 CẤU TRÚC DỰ ÁN

```
📦 CLB-Vo-Co-Truyen-HUTECH/
├── 🖥️ backend/                 # Backend API Server
│   ├── 📁 config/              # Cấu hình database, swagger
│   ├── 📁 middleware/          # Middleware xác thực, validation
│   ├── 📁 routes/              # API routes
│   ├── 📁 services/            # Business logic services
│   ├── 📁 database/            # Database schema & migrations
│   └── 📄 server.js            # Main server file
├── 🌐 website/                 # Frontend Website
│   ├── 📁 views/account/       # Trang đăng nhập, dashboard
│   ├── 📁 components/          # Components tái sử dụng
│   ├── 📁 config/              # Cấu hình frontend
│   ├── 📁 assets/              # Hình ảnh, CSS, JS
│   └── 📄 index.html           # Trang chủ
├── 📄 test-integrated-dashboard.html  # Test dashboard
└── 📚 Documentation/           # Tài liệu hướng dẫn
```

---

## 🔍 TROUBLESHOOTING

### **Lỗi thường gặp:**

#### **1. Không kết nối được Backend**
```bash
# Kiểm tra server có chạy không
curl http://localhost:3001/health

# Khởi động lại server
cd backend
npm start
```

#### **2. Lỗi đăng nhập**
- Kiểm tra email/password chính xác
- Xóa localStorage và thử lại
- Kiểm tra API `/api/auth/login`

#### **3. Không hiển thị dữ liệu**
- Kiểm tra token trong localStorage
- Kiểm tra CORS settings
- Xem Console để debug

#### **4. Database lỗi**
```bash
# Kiểm tra kết nối database
cd backend
node -e "require('./config/db').testConnection().then(console.log)"
```

---

## 📞 HỖ TRỢ

### **Liên hệ hỗ trợ:**
- **Email:** support@hutech.edu.vn
- **Phone:** (028) 5445 7777
- **Website:** https://hutech.edu.vn

### **Tài liệu kỹ thuật:**
- **API Documentation:** `http://localhost:3001/api-docs`
- **Database Schema:** `/backend/database/schema.sql`
- **Frontend Config:** `/website/config/`

---

## 🎉 HOÀN THÀNH!

Hệ thống CLB Võ Cổ Truyền HUTECH đã sẵn sàng sử dụng với đầy đủ tính năng:

✅ **Authentication & Authorization**  
✅ **User Management System**  
✅ **Admin Dashboard**  
✅ **Notification System**  
✅ **Class Management**  
✅ **Responsive Design**  
✅ **API Documentation**  
✅ **Testing Tools**  

**Chúc bạn sử dụng hệ thống hiệu quả! 🥋**