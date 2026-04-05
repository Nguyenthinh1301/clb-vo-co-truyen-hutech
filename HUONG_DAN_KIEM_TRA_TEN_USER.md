# 🔍 Hướng dẫn kiểm tra hiển thị tên User trong Dashboard

## 📋 Tổng quan vấn đề

User Dashboard cần hiển thị đúng họ tên mà người dùng đã đăng ký. Hệ thống đã được cập nhật để xử lý tốt hơn việc hiển thị tên từ dữ liệu backend.

## ✅ Những gì đã được sửa

### 1. **Backend (backend/routes/auth.js)**
- ✅ Backend đã tạo trường `full_name` khi đăng ký (dòng 48)
- ✅ Backend trả về đầy đủ thông tin user bao gồm: `first_name`, `last_name`, `full_name`
- ✅ Dữ liệu được trả về trong cả `/register` và `/login` endpoints

### 2. **Auth Manager (website/config/auth.js)**
- ✅ Lưu đầy đủ thông tin user vào localStorage
- ✅ Hàm `saveToStorage()` lưu toàn bộ object user
- ✅ Hàm `getCurrentUser()` trả về đầy đủ thông tin

### 3. **User Dashboard (dashboard/js/user-dashboard.js)**
- ✅ Cập nhật hàm `loadUserInfo()` để ưu tiên sử dụng `full_name` từ backend
- ✅ Fallback logic: `full_name` → `first_name + last_name` → `username` → `email`
- ✅ Thêm console.log để debug dễ dàng hơn

## 🧪 Cách kiểm tra

### Phương pháp 1: Sử dụng công cụ test

1. **Mở file test:**
   ```
   TEST_USER_NAME_DISPLAY.html
   ```

2. **Kiểm tra các thông tin:**
   - ✅ Thông tin trong localStorage
   - ✅ Thông tin User hiện tại
   - ✅ Kết quả hiển thị tên
   - ✅ Raw data (JSON)

3. **Các nút công cụ:**
   - 🔄 **Làm mới dữ liệu**: Reload tất cả thông tin
   - 📊 **Mở Dashboard**: Mở dashboard tương ứng với role
   - 🗑️ **Xóa dữ liệu Auth**: Clear localStorage và test lại

### Phương pháp 2: Kiểm tra trực tiếp

1. **Đăng ký tài khoản mới:**
   ```
   Họ: Nguyễn
   Tên: Văn An
   Email: test@example.com
   Password: Test123456
   ```

2. **Sau khi đăng ký thành công:**
   - Hệ thống tự động đăng nhập
   - Chuyển hướng đến User Dashboard

3. **Kiểm tra hiển thị:**
   - Header trái: "Xin chào, Nguyễn!" (first_name)
   - Header phải: "Nguyễn Văn An" (full_name)

### Phương pháp 3: Kiểm tra bằng Console

1. **Mở Dashboard và bấm F12**

2. **Chạy các lệnh sau trong Console:**

```javascript
// Kiểm tra localStorage
console.log('Token:', localStorage.getItem('authToken'));
console.log('User:', JSON.parse(localStorage.getItem('currentUser')));

// Kiểm tra Auth Manager
console.log('Is Authenticated:', Auth.isAuthenticated());
console.log('Current User:', Auth.getCurrentUser());

// Kiểm tra các trường tên
const user = Auth.getCurrentUser();
console.log('First Name:', user.first_name);
console.log('Last Name:', user.last_name);
console.log('Full Name:', user.full_name);

// Kiểm tra hiển thị
console.log('Display Name:', document.getElementById('userName').textContent);
console.log('Full Name Display:', document.getElementById('userFullName').textContent);
```

## 🔧 Xử lý sự cố

### Vấn đề 1: Tên hiển thị là email thay vì họ tên

**Nguyên nhân:**
- User data trong localStorage không có `first_name`, `last_name`, hoặc `full_name`
- Có thể do đăng nhập bằng tài khoản cũ (trước khi cập nhật)

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Hoặc đăng ký tài khoản mới để test

### Vấn đề 2: Tên không cập nhật sau khi đăng ký

**Nguyên nhân:**
- Browser cache
- localStorage không được cập nhật đúng

**Giải pháp:**
1. Hard refresh: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
2. Xóa localStorage và đăng nhập lại:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

### Vấn đề 3: Console hiển thị lỗi

**Kiểm tra:**
1. Backend có đang chạy không? (http://localhost:3000)
2. Có lỗi CORS không?
3. Token có hợp lệ không?

**Giải pháp:**
```bash
# Khởi động lại backend
cd backend
npm start
```

## 📊 Luồng dữ liệu

```
1. User đăng ký
   ↓
2. Frontend gửi: { firstName, lastName, email, password, ... }
   ↓
3. Backend nhận và xử lý:
   - Tạo full_name = firstName + lastName
   - Lưu vào database
   ↓
4. Backend trả về:
   {
     user: {
       id, email, username,
       first_name, last_name, full_name,
       role, ...
     },
     token, refreshToken
   }
   ↓
5. Auth.register() nhận response
   ↓
6. Auth.saveToStorage(token, user)
   - Lưu vào localStorage
   ↓
7. Auto login sau đăng ký
   ↓
8. Redirect đến Dashboard
   ↓
9. Dashboard load:
   - Auth.getCurrentUser()
   - loadUserInfo()
   - Hiển thị tên
```

## 🎯 Kết quả mong đợi

### Sau khi đăng ký với thông tin:
- Họ: **Nguyễn**
- Tên: **Văn An**

### Dashboard sẽ hiển thị:
1. **Header trái:** "Xin chào, Nguyễn!"
2. **Header phải (User info):**
   - Tên: "Nguyễn Văn An"
   - Role: "Thành viên"

### Trong Profile section:
- **Họ tên đầy đủ:** Nguyễn Văn An
- **Email:** [email đã đăng ký]
- **Các thông tin khác:** [theo form đăng ký]

## 📝 Ghi chú quan trọng

1. **Backend phải đang chạy** để đăng ký/đăng nhập hoạt động
2. **Hard refresh** sau khi cập nhật code để clear cache
3. **Tài khoản cũ** (trước khi cập nhật) có thể không có đầy đủ thông tin tên
4. **Đăng ký tài khoản mới** để test đầy đủ tính năng

## 🔗 Files liên quan

- `backend/routes/auth.js` - Backend authentication routes
- `website/config/auth.js` - Frontend Auth Manager
- `dashboard/js/user-dashboard.js` - User Dashboard logic
- `website/views/account/dang-ky.html` - Registration form
- `TEST_USER_NAME_DISPLAY.html` - Testing tool

## 💡 Tips

1. **Luôn kiểm tra Console** để xem log và errors
2. **Sử dụng TEST_USER_NAME_DISPLAY.html** để debug nhanh
3. **Đăng ký tài khoản test mới** thay vì dùng tài khoản cũ
4. **Clear localStorage** nếu gặp vấn đề về cache

---

**Cập nhật lần cuối:** 2025-02-21
**Trạng thái:** ✅ Đã sửa và test
