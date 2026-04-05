# Tính Năng Profile - Thông Tin Cá Nhân

## Mô tả
Tính năng Profile cho phép người dùng xem và chỉnh sửa thông tin cá nhân trên website CLB Võ Cổ Truyền HUTECH.

## Files đã tạo/cập nhật

### 1. Trang Profile
- **File**: `views/account/profile.html`
- **Mô tả**: Trang chính cho việc quản lý thông tin cá nhân
- **Tính năng**:
  - Xem và chỉnh sửa thông tin cá nhân
  - Đổi mật khẩu
  - Xem hoạt động gần đây
  - Quản lý phiên đăng nhập
  - Upload avatar

### 2. CSS Profile
- **File**: `assets/css/profile.css`
- **Mô tả**: Styles cho trang profile
- **Tính năng**:
  - Responsive design
  - Tab navigation
  - Form styling
  - User dropdown menu
  - Animations

### 3. Header được cập nhật
- **File**: `components/header.html`
- **Cập nhật**:
  - Thêm dropdown menu cho user đã đăng nhập
  - Link đến trang profile
  - Menu đăng xuất

### 4. AuthManager được cập nhật
- **File**: `config/auth.js`
- **Cập nhật**:
  - Hàm `updateHeaderForLoggedInUser()` được cải thiện
  - Thêm `initializeUserDropdown()` để xử lý dropdown
  - Quản lý avatar path based on location

### 5. File test
- **File**: `views/test-profile.html`
- **Mô tả**: Trang test để kiểm tra tính năng profile

## Cách sử dụng

### 1. Để test tính năng:
1. Mở file `views/test-profile.html` trong browser
2. Click "Đăng nhập user test" để tạo user test
3. Quay về trang chủ và thấy dropdown menu ở header
4. Click vào dropdown và chọn "Thông tin cá nhân"

### 2. Tính năng Profile bao gồm:

#### Tab "Thông tin cá nhân":
- Họ và tên
- Email
- Số điện thoại
- Ngày sinh
- Giới tính
- Mã số sinh viên
- Địa chỉ
- Giới thiệu bản thân
- Upload avatar

#### Tab "Bảo mật":
- Đổi mật khẩu với kiểm tra độ mạnh
- Bật/tắt xác thực hai bước
- Thông báo đăng nhập

#### Tab "Hoạt động":
- Xem hoạt động gần đây
- Quản lý phiên đăng nhập

## Cấu trúc dữ liệu User

```javascript
{
  id: 'user_id',
  fullName: 'Họ và tên',
  email: 'email@example.com',
  phone: '0123456789',
  birthDate: '2000-01-01',
  gender: 'male|female|other',
  studentId: 'HUTECH123',
  address: 'Địa chỉ đầy đủ',
  bio: 'Giới thiệu bản thân',
  avatar: 'data:image/... hoặc URL'
}
```

## Responsive Design
- Desktop: Full layout với sidebar navigation
- Tablet: Adaptive layout
- Mobile: Stack layout với mobile-optimized forms

## Security Features
- Password strength checker
- Confirmation before password change
- Session management
- Activity logging

## Notes
- Dữ liệu hiện tại được lưu trong localStorage (demo)
- Trong production, cần kết nối với backend API
- Avatar được lưu dưới dạng base64 (demo)
- Form validation được thực hiện ở frontend

## Browser Support
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
