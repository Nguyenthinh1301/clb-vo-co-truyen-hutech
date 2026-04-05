# 🌐 WEBSITE GIỚI THIỆU CLB VÕ CỔ TRUYỀN HUTECH

## 📋 Mô Tả

Website giới thiệu công khai của Câu Lạc Bộ Võ Cổ Truyền HUTECH.  
Website này **KHÔNG** có chức năng đăng nhập/đăng ký cho người dùng.

---

## 🎯 Mục Đích

- Giới thiệu thông tin về CLB
- Hiển thị lịch tập luyện
- Giới thiệu đội ngũ huấn luyện viên
- Trưng bày thành tích và hình ảnh hoạt động
- Cung cấp thông tin liên hệ

---

## 📁 Cấu Trúc

```
website/
├── index.html              # Trang chủ
├── styles.css              # CSS chính
├── script.js               # JavaScript chính
├── components/             # Các component HTML
│   ├── header.html         # Header (không có menu đăng nhập)
│   ├── hero-section.html   # Banner chính
│   ├── about-section.html  # Giới thiệu CLB
│   ├── schedule-section.html # Lịch tập
│   ├── coaches-section.html  # Huấn luyện viên
│   ├── gallery-section.html  # Thành tích
│   ├── services-section.html # Dịch vụ
│   ├── contact-section.html  # Liên hệ
│   └── footer.html         # Footer
├── assets/                 # Tài nguyên
│   ├── images/            # Hình ảnh
│   ├── css/               # CSS bổ sung
│   └── js/                # JavaScript bổ sung
└── views/                  # Các trang khác (nếu có)
```

---

## ✨ Tính Năng

### ✅ Có sẵn:
- Responsive design (mobile-friendly)
- Smooth scrolling navigation
- Contact form
- Image gallery
- Schedule display
- Coach profiles

### ❌ Đã xóa bỏ:
- Menu đăng nhập/đăng ký
- Trang đăng ký thành viên
- Trang đăng nhập
- Authentication logic
- User dashboard links

---

## 🚀 Chạy Website

### Cách 1: Sử dụng Live Server (VS Code)

1. Cài đặt extension "Live Server"
2. Right-click vào `index.html`
3. Chọn "Open with Live Server"

### Cách 2: Sử dụng Node.js server

```bash
cd website
node server.js
```

Truy cập: `http://localhost:3000`

### Cách 3: Mở trực tiếp file HTML

Double-click vào `index.html` (một số tính năng có thể không hoạt động)

---

## 📝 Chỉnh Sửa Nội Dung

### Thay đổi thông tin CLB:

1. **Giới thiệu**: Sửa `components/about-section.html`
2. **Lịch tập**: Sửa `components/schedule-section.html`
3. **Huấn luyện viên**: Sửa `components/coaches-section.html`
4. **Thành tích**: Sửa `components/gallery-section.html`
5. **Liên hệ**: Sửa `components/contact-section.html`

### Thay đổi hình ảnh:

- Thêm hình vào `assets/images/`
- Cập nhật đường dẫn trong các file HTML

### Thay đổi màu sắc/font:

- Sửa file `styles.css`
- Tìm biến CSS ở đầu file để thay đổi theme

---

## 📧 Form Liên Hệ

Form liên hệ hiện tại chỉ hiển thị thông báo thành công (demo).

### Để kích hoạt gửi email thực:

**Option 1: Sử dụng EmailJS (miễn phí)**

1. Đăng ký tài khoản tại https://www.emailjs.com/
2. Tạo email template
3. Thêm code vào `script.js`:

```javascript
emailjs.send("service_id", "template_id", formData)
    .then(() => {
        showNotification('Email đã được gửi!', 'success');
    });
```

**Option 2: Sử dụng Formspree (miễn phí)**

1. Đăng ký tại https://formspree.io/
2. Thay đổi form action trong `contact-section.html`:

```html
<form action="https://formspree.io/f/your-form-id" method="POST">
```

**Option 3: Kết nối với Backend**

Giữ nguyên backend hiện tại và gọi API:

```javascript
fetch('http://localhost:5000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});
```

---

## 🌍 Deploy Website

### Netlify (Khuyến nghị - Miễn phí):

1. Push code lên GitHub
2. Đăng nhập Netlify
3. "New site from Git" → Chọn repo
4. Deploy settings:
   - Build command: (để trống)
   - Publish directory: `website`
5. Deploy!

### Vercel (Miễn phí):

1. Cài đặt Vercel CLI: `npm i -g vercel`
2. Chạy: `vercel`
3. Follow instructions

### GitHub Pages (Miễn phí):

1. Push code lên GitHub
2. Settings → Pages
3. Source: main branch, folder: `/website`
4. Save

---

## 🔧 Bảo Trì

### Cập nhật thông tin thường xuyên:

- [ ] Lịch tập mới mỗi học kỳ
- [ ] Thêm hình ảnh hoạt động mới
- [ ] Cập nhật thành tích mới
- [ ] Kiểm tra form liên hệ hoạt động

### Kiểm tra định kỳ:

- [ ] Test trên mobile devices
- [ ] Kiểm tra tốc độ load (Google PageSpeed)
- [ ] Kiểm tra broken links
- [ ] Backup code

---

## 📞 Liên Hệ Hỗ Trợ

Nếu cần hỗ trợ kỹ thuật, liên hệ:
- Email: [email hỗ trợ]
- Phone: [số điện thoại]

---

## 📄 License

© 2026 CLB Võ Cổ Truyền HUTECH. All rights reserved.

---

**Lưu ý**: Website này là phần công khai. Hệ thống quản trị nội bộ nằm ở thư mục `/dashboard/` và chỉ dành cho admin.
