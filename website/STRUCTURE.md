# Cấu trúc Website CLB Võ Cổ Truyền HUTECH

## Tổng quan
Website đã được tái cấu trúc thành các file nhỏ, dễ quản lý và bảo trì. Mỗi thành phần được tách ra thành file riêng biệt.

## Cấu trúc thư mục

```
website/
├── index.html                  # Trang chủ chính (sử dụng components)
├── script.js                   # JavaScript chính
├── styles.css                  # CSS toàn bộ website
├── README.md                   # File hướng dẫn chính
├── docs/
│   └── user-guide.md          # Hướng dẫn sử dụng
├── assets/                     # Tài nguyên tĩnh
│   ├── icons/                 # Icons
│   ├── images/                # Hình ảnh
│   └── videos/                # Video
├── components/                 # Các thành phần có thể tái sử dụng
│   ├── header.html            # Header/Navigation
│   ├── footer.html            # Footer
│   ├── hero-section.html      # Phần Hero/Banner
│   ├── about-section.html     # Phần giới thiệu
│   ├── services-section.html  # Phần dịch vụ
│   └── contact-section.html   # Phần liên hệ
├── pages/                      # Các trang riêng biệt
│   ├── home.html             # Trang chủ (đầy đủ components)
│   ├── about.html            # Trang giới thiệu chi tiết
│   ├── services.html         # Trang dịch vụ với bảng giá
│   └── contact.html          # Trang liên hệ với FAQ
├── views/                      # Views cho các chức năng cụ thể
│   └── account/               # Quản lý tài khoản
│       ├── dang-nhap.html    # Trang đăng nhập
│       └── dang-ky.html      # Trang đăng ký
└── controllers/               # Thư mục cho logic xử lý (future)
```

## Cách thức hoạt động

### 1. Components (Thành phần)
- Mỗi component là một file HTML riêng chứa một phần của giao diện
- Được load động vào các trang thông qua JavaScript
- Có thể tái sử dụng trên nhiều trang khác nhau

### 2. Pages (Trang)
- Các trang hoàn chỉnh với layout riêng
- Sử dụng components để xây dựng giao diện
- Mỗi trang có thể có logic JavaScript riêng

### 3. Views (Giao diện)
- Các giao diện chuyên biệt cho từng chức năng
- Ví dụ: views/account/ chứa các trang liên quan đến tài khoản

## Cách sử dụng

### Chạy website
1. Mở `index.html` trong trình duyệt để xem trang chủ
2. Hoặc mở các file trong thư mục `pages/` để xem từng trang riêng
3. Để test đầy đủ, nên chạy qua web server (Live Server trong VS Code)

### Thêm component mới
1. Tạo file HTML trong thư mục `components/`
2. Viết HTML cho component
3. Thêm vào trang cần sử dụng bằng `loadComponent()`

### Thêm trang mới
1. Tạo file HTML trong thư mục `pages/`
2. Copy cấu trúc từ trang có sẵn
3. Thêm các component cần thiết
4. Cập nhật navigation trong `components/header.html`

## Tính năng

### Đã hoàn thành
- ✅ Trang chủ với các section chính
- ✅ Trang giới thiệu với timeline lịch sử
- ✅ Trang dịch vụ với bảng giá
- ✅ Trang liên hệ với FAQ
- ✅ Hệ thống đăng nhập/đăng ký
- ✅ Responsive design
- ✅ Component loading system

### Có thể mở rộng
- 🔄 Kết nối backend cho form
- 🔄 Hệ thống quản lý thành viên
- 🔄 Tích hợp Google Maps
- 🔄 Hệ thống thanh toán
- 🔄 Admin panel
- 🔄 Blog/Tin tức

## Lưu ý kỹ thuật

1. **Component Loading**: Sử dụng `fetch()` để load components, cần chạy qua web server
2. **CSS**: Tất cả styles được tập trung trong `styles.css`
3. **JavaScript**: Logic chính trong `script.js`, logic riêng trong từng trang
4. **Responsive**: Thiết kế responsive cho mobile và desktop

## Đóng góp

Để thêm tính năng mới:
1. Tạo component/page theo cấu trúc hiện tại
2. Cập nhật CSS trong `styles.css`
3. Test trên nhiều thiết bị
4. Cập nhật documentation này

---

**Phát triển bởi**: CLB Võ Cổ Truyền HUTECH
**Email**: vocotruyenhutech1999@gmail.com
**Điện thoại**: +84 912 209 095
