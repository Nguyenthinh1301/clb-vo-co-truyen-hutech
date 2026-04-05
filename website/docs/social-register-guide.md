# Hướng dẫn Đăng ký bằng Google/Facebook

## Tổng quan
Trang đăng ký của CLB Võ Cổ Truyền HUTECH đã được bổ sung chức năng đăng ký bằng Google và Facebook, tương tự như trang đăng nhập.

## Tính năng mới

### 1. Đăng ký bằng Google
- Nút "Đăng ký bằng Google" với icon Google
- Tích hợp Google Sign-In API
- Tự động tạo tài khoản từ thông tin Google
- Kiểm tra email trùng lặp

### 2. Đăng ký bằng Facebook  
- Nút "Đăng ký bằng Facebook" với icon Facebook
- Tích hợp Facebook SDK
- Tự động tạo tài khoản từ thông tin Facebook
- Kiểm tra email trùng lặp

### 3. Xử lý dữ liệu
- Lưu thông tin người dùng vào localStorage
- Tự động chuyển hướng đến dashboard sau khi đăng ký thành công
- Hiển thị thông báo lỗi/thành công

## Cấu trúc File

### Files đã cập nhật:
- `views/account/dang-ky.html` - Trang đăng ký chính
- `docs/api-documentation.md` - Tài liệu API

### Files mới:
- `views/social-register-test.html` - Trang test chức năng đăng ký
- `docs/social-register-guide.md` - Hướng dẫn này

## Cách sử dụng

### 1. Truy cập trang đăng ký
```
website/views/account/dang-ky.html
```

### 2. Chọn phương thức đăng ký
- Đăng ký thường: Điền form và submit
- Đăng ký Google: Click nút "Đăng ký bằng Google"
- Đăng ký Facebook: Click nút "Đăng ký bằng Facebook"

### 3. Test chức năng
```
website/views/social-register-test.html
```

## Cấu hình Social Login

### Google Sign-In
1. Tạo project trên [Google Cloud Console](https://console.cloud.google.com/)
2. Bật Google Sign-In API
3. Tạo OAuth 2.0 client ID
4. Thay thế `YOUR_GOOGLE_CLIENT_ID` trong file

### Facebook Login
1. Tạo app trên [Facebook Developers](https://developers.facebook.com/)
2. Bật Facebook Login
3. Cấu hình OAuth redirect URIs
4. Thay thế `YOUR_FACEBOOK_APP_ID` trong file

## Demo Mode
Khi chưa cấu hình API thực tế, hệ thống sẽ chạy ở chế độ demo:
- Tạo user demo với thông tin mẫu
- Lưu vào localStorage
- Hiển thị thông báo "(Demo)"

## Tích hợp API

### Endpoint mới:
- `POST /auth/social-register` - Đăng ký bằng social login
- Xem chi tiết trong `docs/api-documentation.md`

### Request Format:
```json
{
  "provider": "google",
  "token": "social_token",
  "userData": {
    "id": "social_id",
    "email": "user@gmail.com",
    "name": "User Name",
    "picture": "profile_picture_url"
  }
}
```

## Kiểm tra Dữ liệu

### localStorage keys:
- `registeredUsers` - Danh sách người dùng đã đăng ký
- `currentUser` - Người dùng hiện tại

### Cách kiểm tra:
```javascript
// Xem người dùng đã đăng ký
console.log(JSON.parse(localStorage.getItem('registeredUsers')));

// Xem người dùng hiện tại
console.log(JSON.parse(localStorage.getItem('currentUser')));
```

## Xử lý Lỗi

### Các trường hợp lỗi:
1. Email đã tồn tại - Chuyển hướng đến trang đăng nhập
2. Lỗi API - Hiển thị thông báo lỗi
3. Người dùng hủy đăng ký - Hiển thị thông báo hủy
4. Lỗi mạng - Hiển thị thông báo thử lại

## Bảo mật

### Các biện pháp:
1. Kiểm tra token từ social provider
2. Xác thực thông tin người dùng
3. Kiểm tra email trùng lặp
4. Lưu trữ an toàn thông tin người dùng

## Tương thích

### Trình duyệt hỗ trợ:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Thiết bị:
- Desktop
- Tablet  
- Mobile (responsive design)

## Liên kết quan trọng

- [Trang đăng ký](../views/account/dang-ky.html)
- [Trang đăng nhập](../views/account/dang-nhap.html)
- [Test chức năng](../views/social-register-test.html)
- [API Demo](../views/api-demo.html)
- [Hướng dẫn OAuth](./social-login-setup.md)

## Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Console log trong trình duyệt
2. Network tab để xem API calls
3. localStorage để xem dữ liệu
4. File `social-register-test.html` để debug

---

*Cập nhật: $(date)*
*Phiên bản: 1.0*
