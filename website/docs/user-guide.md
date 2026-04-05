# Tài liệu hướng dẫn sử dụng

## Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Cài đặt và thiết lập](#cài-đặt-và-thiết-lập)
3. [Cấu trúc website](#cấu-trúc-website)
4. [Tùy chỉnh giao diện](#tùy-chỉnh-giao-diện)
5. [Thêm nội dung](#thêm-nội-dung)
6. [Triển khai website](#triển-khai-website)

## Giới thiệu

Website ThongTin-VCT là một trang web responsive được xây dựng với:
- HTML5 semantic markup
- CSS3 với Flexbox và Grid
- Vanilla JavaScript (ES6+)
- Mobile-first responsive design

## Cài đặt và thiết lập

### Yêu cầu hệ thống
- Trình duyệt web hiện đại
- Text editor (khuyến nghị VS Code)
- Live Server extension (cho development)

### Khởi chạy website
1. Mở VS Code
2. Mở thư mục `website`
3. Cài đặt Live Server extension
4. Right-click vào `index.html` → "Open with Live Server"

## Cấu trúc website

### HTML Structure
```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Meta tags, title, CSS links -->
  </head>
  <body>
    <header>
      <!-- Navigation menu -->
    </header>
    <main>
      <section id="home"><!-- Hero section --></section>
      <section id="about"><!-- About section --></section>
      <section id="services"><!-- Services section --></section>
      <section id="contact"><!-- Contact section --></section>
    </main>
    <footer>
      <!-- Footer content -->
    </footer>
  </body>
</html>
```

### CSS Architecture
- **Reset styles**: Normalize default browser styles
- **Base styles**: Typography, colors, layout
- **Component styles**: Header, sections, footer
- **Responsive styles**: Media queries for different screen sizes

### JavaScript Modules
- **Navigation**: Smooth scrolling, active states
- **Animations**: Intersection Observer for scroll animations
- **Mobile**: Responsive menu functionality
- **Utilities**: Helper functions for common tasks

## Tùy chỉnh giao diện

### Thay đổi màu sắc
Trong file `styles.css`, tìm và thay đổi các biến màu:

```css
/* Thay đổi màu chính */
.hero {
    background: linear-gradient(135deg, #YOUR_COLOR, #YOUR_COLOR_2);
}

/* Thay đổi màu header */
header {
    background: #YOUR_HEADER_COLOR;
}
```

### Thay đổi font chữ
```css
body {
    font-family: 'Your Font Name', Arial, sans-serif;
}
```

### Thêm Google Fonts
Trong `<head>` của `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
```

## Thêm nội dung

### Thêm section mới
1. **HTML**: Thêm section mới trong `<main>`
```html
<section id="new-section" class="new-section">
    <div class="container">
        <h2>Tiêu đề section</h2>
        <p>Nội dung section</p>
    </div>
</section>
```

2. **CSS**: Thêm styles cho section mới
```css
.new-section {
    padding: 60px 0;
    background: #f8f9fa;
}

.new-section h2 {
    text-align: center;
    margin-bottom: 2rem;
}
```

3. **Navigation**: Thêm link vào menu
```html
<li><a href="#new-section">Section mới</a></li>
```

### Thêm hình ảnh
1. Đặt file hình ảnh vào `assets/images/`
2. Sử dụng trong HTML:
```html
<img src="assets/images/your-image.jpg" alt="Mô tả hình ảnh">
```

### Thêm video
1. Đặt file video vào `assets/videos/`
2. Sử dụng trong HTML:
```html
<video controls>
    <source src="assets/videos/your-video.mp4" type="video/mp4">
    Trình duyệt không hỗ trợ video.
</video>
```

### Thêm icon
1. Đặt file icon vào `assets/icons/`
2. Hoặc sử dụng Font Awesome:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<i class="fas fa-home"></i>
```

## Tối ưu hóa

### Performance
- Tối ưu hóa hình ảnh (WebP format)
- Minify CSS và JavaScript
- Sử dụng lazy loading cho images
- Optimize fonts loading

### SEO
- Thêm meta description
- Sử dụng semantic HTML
- Alt text cho images
- Structured data markup

### Accessibility
- Keyboard navigation
- Screen reader support
- High contrast colors
- Focus indicators

## Triển khai website

### GitHub Pages
1. Tạo repository trên GitHub
2. Push code lên repository
3. Vào Settings → Pages
4. Chọn source: Deploy from branch → main
5. Website sẽ có địa chỉ: `username.github.io/repository-name`

### Netlify
1. Đăng ký tài khoản Netlify
2. Connect GitHub repository
3. Deploy settings:
   - Build command: (để trống)
   - Publish directory: `.`
4. Deploy site

### Custom Domain
1. Mua domain name
2. Cấu hình DNS:
   - A record: point to hosting IP
   - CNAME: www to main domain
3. Update hosting settings

## Troubleshooting

### Lỗi thường gặp
1. **CSS không load**: Kiểm tra đường dẫn file CSS
2. **JavaScript không hoạt động**: Kiểm tra console errors
3. **Hình ảnh không hiển thị**: Kiểm tra đường dẫn và tên file
4. **Menu không responsive**: Kiểm tra CSS media queries

### Debug tools
- Browser Developer Tools (F12)
- Console để xem JavaScript errors
- Network tab để kiểm tra file loading
- Mobile device simulation

## Liên hệ hỗ trợ

Nếu cần hỗ trợ thêm, vui lòng liên hệ:
- Email: support@thongtin-vct.com
- Documentation: Xem thêm trong thư mục `docs/`
