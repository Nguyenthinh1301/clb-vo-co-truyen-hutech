# Trang Thông tin Cá nhân (Profile Page)

## Tổng quan

Trang thông tin cá nhân cho phép người dùng xem và chỉnh sửa thông tin cá nhân, thông tin võ thuật, quản lý thành tích và cài đặt tài khoản.

## Tính năng chính

### 1. Thông tin cá nhân
- **Họ và tên**: Tên đầy đủ của người dùng
- **Số điện thoại**: Số liên lạc
- **Ngày sinh**: Ngày tháng năm sinh
- **Giới tính**: Nam, Nữ, Khác
- **Địa chỉ**: Địa chỉ nơi ở
- **Giới thiệu bản thân**: Mô tả ngắn về bản thân

### 2. Thông tin võ thuật
- **Môn phái**: Loại võ thuật đang luyện tập
- **Cấp bậc/Đai**: Trình độ hiện tại
- **Số năm luyện tập**: Kinh nghiệm luyện tập
- **Ngày gia nhập CLB**: Thời gian bắt đầu tham gia
- **Chuyên môn**: Mô tả kỹ năng đặc biệt

### 3. Thành tích và Giải thưởng
- **Quản lý thành tích**: Thêm, sửa, xóa thành tích
- **Thông tin giải thưởng**: Tên, cuộc thi, hạng, ngày đạt được
- **Mô tả chi tiết**: Thông tin bổ sung về thành tích

### 4. Cài đặt tài khoản
- **Đổi mật khẩu**: Thay đổi mật khẩu bảo mật
- **Cài đặt thông báo**: Bật/tắt thông báo email và nhắc nhở
- **Xóa tài khoản**: Tùy chọn xóa tài khoản vĩnh viễn

## Cách sử dụng

### Truy cập trang Profile
1. Đăng nhập vào tài khoản
2. Click vào avatar/tên người dùng trên header
3. Chọn "Thông tin cá nhân" từ menu dropdown
4. Hoặc truy cập trực tiếp: `views/account/profile.html`

### Chỉnh sửa thông tin
1. Click vào tab tương ứng (Thông tin cá nhân, Thông tin võ thuật, ...)
2. Điền/chỉnh sửa thông tin trong form
3. Click "Lưu thay đổi" để cập nhật

### Quản lý thành tích
1. Chuyển đến tab "Thành tích"
2. Click "Thêm thành tích" để thêm mới
3. Điền thông tin trong modal popup
4. Click "Lưu" để lưu thành tích
5. Sử dụng nút xóa để xóa thành tích không cần thiết

### Thay đổi avatar
1. Click vào nút camera trên avatar
2. Chọn file ảnh từ máy tính
3. Ảnh sẽ được cập nhật tự động

## Bảo mật

- Tất cả thông tin được lưu trữ trong localStorage (demo)
- Mật khẩu phải có ít nhất 6 ký tự
- Xác nhận mật khẩu mới khi đổi mật khẩu
- Xác nhận trước khi xóa tài khoản

## Responsive Design

- Tối ưu cho desktop, tablet và mobile
- Layout linh hoạt thích ứng với nhiều kích thước màn hình
- Menu tab chuyển thành dạng accordion trên mobile

## Tính năng nâng cao

### Notification System
- Thông báo thành công khi lưu thông tin
- Thông báo lỗi khi có vấn đề
- Tự động ẩn sau 3 giây

### Form Validation
- Kiểm tra dữ liệu đầu vào
- Hiển thị thông báo lỗi rõ ràng
- Ngăn chặn submit form không hợp lệ

### User Experience
- Smooth transitions và animations
- Loading states cho các action
- Confirmation dialogs cho actions quan trọng

## File structure

```
views/account/
├── profile.html          # Trang chính
├── assets/css/
│   └── profile.css       # Styles cho trang profile
├── components/
│   └── header.html       # Header với profile dropdown
└── config/
    └── auth.js           # Authentication logic
```

## Tích hợp với hệ thống

- **Authentication**: Kiểm tra đăng nhập trước khi truy cập
- **Header Integration**: Profile dropdown trong navigation
- **Data Persistence**: Lưu trữ thông tin trong localStorage
- **Routing**: Tích hợp với navigation system

## Customization

### Thêm trường thông tin mới
1. Thêm input field vào form trong HTML
2. Cập nhật CSS cho styling
3. Thêm logic save/load trong JavaScript
4. Cập nhật validation nếu cần

### Thay đổi theme
1. Chỉnh sửa CSS variables
2. Cập nhật color scheme
3. Thay đổi font family nếu cần

### Tích hợp API
1. Thay thế localStorage bằng API calls
2. Thêm error handling cho network requests
3. Implement caching strategy

## Troubleshooting

### Lỗi thường gặp
- **Không thể truy cập trang**: Kiểm tra trạng thái đăng nhập
- **Thông tin không lưu**: Kiểm tra localStorage capacity
- **Layout bị vỡ**: Kiểm tra CSS imports
- **Icons không hiển thị**: Kiểm tra Font Awesome CDN

### Performance
- Optimize images cho avatar
- Minify CSS/JS files
- Implement lazy loading cho large datasets

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers với modern features

## Cập nhật trong tương lai

### Planned Features
- [ ] Upload avatar lên server
- [ ] Export profile data
- [ ] Social media integration
- [ ] Achievement sharing
- [ ] Photo gallery for martial arts events
- [ ] Training schedule integration
- [ ] Fitness tracking
- [ ] Belt progression tracking
