# Dashboard CSS - Hướng dẫn sử dụng

## 📁 Cấu trúc thư mục

```
dashboard/
├── css/
│   ├── dashboard.css      # CSS chính cho dashboard
│   └── README.md          # File này
├── dashboard.html         # Trang dashboard chính
└── ...
```

## 📋 Mục lục CSS (dashboard.css)

File `dashboard.css` được tổ chức theo 12 phần chính:

### 1. **Base Styles** (Dòng 1-60)
- `.dashboard` - Container chính
- `.dashboard::before` - Background overlay
- `.dashboard-container` - Content wrapper

### 2. **Header & Navigation** (Dòng 61-200)
- `.dashboard-header` - Header chính
- `.user-info`, `.user-avatar`, `.user-details` - Thông tin user
- `.header-actions` - Các nút action
- `.notification-btn`, `.logout-btn` - Buttons
- `.nav-tabs`, `.nav-tab` - Navigation tabs

### 3. **Content Sections** (Dòng 201-250)
- `.content-section` - Các section nội dung
- `.dashboard-grid` - Grid layout
- `.dashboard-card` - Card components

### 4. **Stats & Cards** (Dòng 251-350)
- `.quick-stats`, `.quick-stat` - Thống kê nhanh
- `.stat-card` - Thẻ thống kê
- `.stat-icon` - Icons với màu sắc
- `.stat-number`, `.stat-label`, `.stat-change` - Số liệu
- `.chart-container` - Container cho charts

### 5. **Tables** (Dòng 351-400)
- `.data-table` - Bảng dữ liệu
- `.data-table th` - Table headers
- `.data-table td` - Table cells
- `.data-table tr:hover` - Hover effects

### 6. **Forms** (Dòng 401-480)
- `.form-grid` - Form layout
- `.form-group`, `.form-label` - Form elements
- `.form-input` - Input fields
- `.select-input` - Select dropdowns

### 7. **Buttons** (Dòng 481-530)
- `.action-btn` - Button chính
- `.action-btn.danger` - Button đỏ
- `.action-btn.success` - Button xanh
- `.action-btn.warning` - Button vàng

### 8. **Modals** (Dòng 531-700)
- `.settings-modal` - Modal container
- `.settings-content` - Modal content
- `.settings-header` - Modal header
- `.settings-body` - Modal body
- `.setting-item` - Setting items
- `.toggle-switch` - Toggle switches
- `.save-settings-btn` - Save button

### 9. **Dark Mode** (Dòng 701-800)
- `body.dark-mode` - Dark mode styles
- Dark mode overrides cho tất cả components

### 10. **Responsive** (Dòng 801-850)
- `@media (max-width: 768px)` - Mobile styles
- Responsive adjustments

### 11. **Animations** (Dòng 851-880)
- `@keyframes spin` - Loading animation
- `@keyframes fadeIn` - Fade in effect
- `@keyframes slideUp` - Slide up effect

### 12. **Utilities** (Dòng 881-950)
- `.status-badge` - Status badges
- `.loading` - Loading state
- `.error`, `.success` - Message states

## 🎨 Color Palette

### Primary Colors
```css
--primary: #6366f1 (Indigo)
--primary-dark: #8b5cf6 (Purple)
```

### Status Colors
```css
--success: #2ecc71 (Green)
--danger: #e74c3c (Red)
--warning: #f39c12 (Orange)
--info: #3498db (Blue)
```

### Stat Icon Colors
```css
--users: #3498db → #2980b9 (Blue gradient)
--classes: #2ecc71 → #27ae60 (Green gradient)
--events: #f39c12 → #e67e22 (Orange gradient)
--revenue: #9b59b6 → #8e44ad (Purple gradient)
```

### Neutral Colors
```css
--background: #f8f9fa (Light gray)
--white: #ffffff
--border: #e9ecef
--text: #333333
--text-muted: #666666
```

## 🔧 Cách sử dụng

### 1. Link CSS vào HTML
```html
<link rel="stylesheet" href="css/dashboard.css">
```

### 2. Sử dụng classes
```html
<!-- Dashboard Container -->
<div class="dashboard">
    <div class="dashboard-container">
        <!-- Content here -->
    </div>
</div>

<!-- Stat Card -->
<div class="dashboard-card stat-card">
    <div class="stat-icon users">
        <i class="fas fa-users"></i>
    </div>
    <div class="stat-number">150</div>
    <div class="stat-label">Thành viên</div>
</div>

<!-- Action Button -->
<button class="action-btn">
    <i class="fas fa-plus"></i> Thêm mới
</button>

<!-- Status Badge -->
<span class="status-badge active">Active</span>
```

### 3. Dark Mode
```javascript
// Bật dark mode
document.body.classList.add('dark-mode');

// Tắt dark mode
document.body.classList.remove('dark-mode');
```

## 📝 Quy tắc đặt tên

### BEM-like naming
- Block: `.dashboard`, `.stat-card`, `.action-btn`
- Element: `.stat-icon`, `.stat-number`, `.stat-label`
- Modifier: `.action-btn.danger`, `.status-badge.active`

### State classes
- `.active` - Trạng thái active
- `.disabled` - Trạng thái disabled
- `.loading` - Đang loading
- `.error` - Có lỗi

## 🎯 Best Practices

### 1. Không sửa trực tiếp trong HTML
- ❌ Không dùng inline styles: `<div style="color: red">`
- ✅ Dùng classes: `<div class="error">`

### 2. Sử dụng CSS variables (nếu cần)
```css
:root {
    --primary-color: #6366f1;
    --border-radius: 15px;
}
```

### 3. Responsive design
- Mobile first approach
- Sử dụng `min-width` thay vì `max-width` khi có thể
- Test trên nhiều kích thước màn hình

### 4. Performance
- Tránh sử dụng quá nhiều animations
- Sử dụng `transform` và `opacity` cho animations
- Minimize repaints và reflows

## 🔄 Cập nhật CSS

### Khi thêm component mới:
1. Thêm vào section phù hợp trong file CSS
2. Thêm comment mô tả
3. Update README này
4. Test responsive

### Khi sửa styles:
1. Tìm class trong file CSS (dùng Ctrl+F)
2. Sửa đổi cẩn thận
3. Test trên nhiều trình duyệt
4. Kiểm tra dark mode

## 📚 Tài liệu tham khảo

- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

## 🐛 Troubleshooting

### CSS không load?
1. Kiểm tra đường dẫn: `href="css/dashboard.css"`
2. Clear browser cache (Ctrl+F5)
3. Kiểm tra console có lỗi không

### Styles bị override?
1. Kiểm tra specificity
2. Sử dụng DevTools để debug
3. Tránh dùng `!important`

### Dark mode không hoạt động?
1. Kiểm tra class `dark-mode` đã được thêm vào `<body>`
2. Kiểm tra localStorage có lưu settings không
3. Xem console có lỗi JavaScript không

## 📞 Liên hệ

Nếu có vấn đề hoặc câu hỏi về CSS, vui lòng liên hệ team phát triển.

---

**Last Updated:** 2025
**Version:** 1.0.0
**Maintainer:** CLB Võ Cổ Truyền HUTECH
