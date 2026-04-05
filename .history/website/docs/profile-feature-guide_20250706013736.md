# Tính năng Thông tin Cá nhân - CLB Võ Cổ Truyền HUTECH

## Tổng quan

Tính năng thông tin cá nhân cho phép thành viên CLB quản lý và cập nhật thông tin cá nhân của mình, bao gồm:
- Thông tin cá nhân cơ bản
- Lịch tập luyện
- Thành tích đạt được
- Cài đặt tài khoản

## Cấu trúc File

```
views/account/
├── profile.html          # Trang thông tin cá nhân chính
├── dashboard.html        # Bảng điều khiển tổng quan
├── edit.html            # Trang chỉnh sửa thông tin
├── dang-nhap.html       # Trang đăng nhập
└── dang-ky.html         # Trang đăng ký

assets/css/
└── profile.css          # CSS riêng cho trang profile

components/
└── header.html          # Header với user dropdown menu

profile-demo.html        # Trang demo tính năng
```

## Tính năng chính

### 1. Header với User Dropdown
- Hiển thị avatar và tên user khi đã đăng nhập
- Dropdown menu với các tùy chọn:
  - Thông tin cá nhân
  - Bảng điều khiển
  - Lịch tập
  - Thành tích
  - Thông báo
  - Cài đặt
  - Đăng xuất

### 2. Trang Thông tin Cá nhân (`profile.html`)
- **Tab Thông tin cá nhân**: Quản lý thông tin cơ bản, địa chỉ, võ thuật, sức khỏe
- **Tab Lịch tập**: Xem và quản lý lịch tập luyện
- **Tab Thành tích**: Danh sách giải thưởng và thành tích
- **Tab Cài đặt**: Đổi mật khẩu, cài đặt thông báo, bảo mật

### 3. Trang Dashboard (`dashboard.html`)
- Thống kê nhanh (buổi tập, giải thưởng, streak, sức khỏe)
- Hoạt động gần đây
- Tiến độ tập luyện
- Thao tác nhanh
- Sự kiện sắp tới

### 4. Tính năng chỉnh sửa
- Chỉnh sửa thông tin trực tiếp trên trang
- Validation và thông báo
- Lưu/hủy thay đổi
- Upload avatar

## Cách sử dụng

### 1. Demo tính năng
```bash
# Mở file demo
open profile-demo.html

# Hoặc chạy trên local server
python -m http.server 8000
# Truy cập: http://localhost:8000/profile-demo.html
```

### 2. Quy trình sử dụng
1. **Đăng nhập**: Click "Đăng nhập Demo" trên trang demo
2. **Truy cập profile**: Click vào avatar/tên user → "Thông tin cá nhân"
3. **Chỉnh sửa**: Click nút edit (✏️) ở mỗi card thông tin
4. **Lưu thay đổi**: Click "Lưu" sau khi chỉnh sửa
5. **Thay đổi avatar**: Click nút camera trên avatar

### 3. Các tab trong profile
- **Thông tin cá nhân**: Quản lý 4 nhóm thông tin chính
- **Lịch tập**: Xem lịch tập trong tuần
- **Thành tích**: Danh sách giải thưởng với icon và ngày
- **Cài đặt**: Đổi mật khẩu, cài đặt thông báo, bảo mật

## Responsive Design

### Desktop
- Layout 2 cột cho thông tin
- Hover effects và animations
- Dropdown menu đầy đủ

### Mobile
- Layout 1 cột
- Tab navigation thu gọn (chỉ icon)
- Touch-friendly interface
- Responsive cards và forms

## Tính năng JavaScript

### 1. Tab Switching
```javascript
// Chuyển đổi giữa các tab
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Logic chuyển tab
    });
});
```

### 2. Edit Functionality
```javascript
// Bật/tắt chế độ chỉnh sửa
function toggleEdit(cardId) {
    // Show/hide inputs và values
    // Toggle edit actions
}

// Lưu thay đổi
function saveEdit(cardId) {
    // Update values từ inputs
    // Show notification
}
```

### 3. User Dropdown
```javascript
// Toggle dropdown menu
userMenuToggle.addEventListener('click', function(e) {
    e.preventDefault();
    userDropdownMenu.classList.toggle('show');
});
```

### 4. Avatar Upload
```javascript
// Upload avatar mới
document.getElementById('avatarUpload').addEventListener('click', function() {
    // Tạo file input
    // Preview image
    // Update avatar
});
```

## CSS Classes quan trọng

### Layout Classes
- `.profile-section`: Container chính
- `.profile-header`: Header với banner và avatar
- `.profile-nav`: Navigation tabs
- `.tab-content`: Nội dung tabs
- `.info-grid`: Grid layout cho thông tin

### Component Classes
- `.info-card`: Card chứa thông tin
- `.nav-btn`: Nút navigation
- `.edit-btn`: Nút chỉnh sửa
- `.save-btn`, `.cancel-btn`: Nút lưu/hủy
- `.notification`: Thông báo

### State Classes
- `.active`: Trạng thái active
- `.show`: Hiển thị dropdown
- `.guest-only`: Chỉ hiển thị cho guest
- `.user-only`: Chỉ hiển thị cho user đã đăng nhập

## Customization

### 1. Thêm thông tin mới
```html
<div class="info-row">
    <label>Thông tin mới:</label>
    <span class="info-value">Giá trị</span>
    <input type="text" class="info-input" value="Giá trị" style="display: none;">
</div>
```

### 2. Thêm tab mới
```html
<button class="nav-btn" data-tab="new-tab">
    <i class="fas fa-icon"></i>
    <span>Tab mới</span>
</button>

<div class="tab-panel" id="new-tab">
    <!-- Nội dung tab -->
</div>
```

### 3. Thêm thống kê dashboard
```html
<div class="stat-card">
    <div class="stat-icon">
        <i class="fas fa-icon"></i>
    </div>
    <div class="stat-number">100</div>
    <div class="stat-label">Thống kê mới</div>
</div>
```

## Tích hợp Backend

### 1. API Endpoints cần thiết
```javascript
// User profile
GET /api/user/profile
PUT /api/user/profile

// Training schedule
GET /api/user/schedule
POST /api/user/schedule

// Achievements
GET /api/user/achievements

// Settings
PUT /api/user/settings
PUT /api/user/password
```

### 2. Data Models
```javascript
// User Profile
{
    id: string,
    name: string,
    email: string,
    phone: string,
    avatar: string,
    // ... other fields
}

// Training Schedule
{
    id: string,
    day: string,
    time: string,
    activity: string,
    location: string
}

// Achievement
{
    id: string,
    title: string,
    description: string,
    date: string,
    icon: string
}
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+
- Mobile browsers

## TODO

- [ ] Kết nối với backend API
- [ ] Thêm validation chi tiết
- [ ] Upload multiple files
- [ ] Push notifications
- [ ] Xuất PDF thông tin
- [ ] Dark mode
- [ ] Multilingual support

## Liên hệ

Nếu có thắc mắc về tính năng này, vui lòng liên hệ team phát triển.
