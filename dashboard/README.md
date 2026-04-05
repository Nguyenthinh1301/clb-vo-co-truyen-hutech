# 📊 Dashboard Files

Folder này chứa tất cả các file liên quan đến dashboard của dự án CLB Võ Cổ Truyền HUTECH.

## 📂 Cấu trúc

### Production Dashboard Files (4 files)
- `dashboard.html` - Dashboard chính (legacy)
- `admin-dashboard-new.html` - Dashboard admin phiên bản mới
- `user-dashboard.html` - Dashboard cho user/member
- `admin-user-management.html` - Quản lý người dùng (admin)

### Test Dashboard Files (6 files)
- `test-dashboard-flow.html` - Test luồng dashboard
- `test-dashboard-debug.html` - Debug dashboard
- `test-integrated-dashboard.html` - Test dashboard tích hợp
- `test-new-dashboard.html` - Test dashboard mới
- `test-admin-dashboard.html` - Test admin dashboard
- `test-dashboard-performance.html` - Test performance

### Fix/Debug Files (1 file)
- `fix-dashboard-image-duplication.html` - Fix lỗi duplicate images

## 🎯 Phân loại Dashboard

### 1. Admin Dashboard
**File:** `admin-dashboard-new.html`

**Chức năng:**
- ✅ Quản lý người dùng
- ✅ Thống kê tổng quan
- ✅ Quản lý lớp học
- ✅ Quản lý sự kiện
- ✅ Báo cáo và phân tích
- ✅ Cài đặt hệ thống

**Quyền truy cập:** Admin only

**URL:** `/dashboard/admin-dashboard-new.html`

---

### 2. User Dashboard
**File:** `user-dashboard.html`

**Chức năng:**
- ✅ Thông tin cá nhân
- ✅ Lịch tập luyện
- ✅ Điểm danh
- ✅ Thành tích
- ✅ Thông báo
- ✅ Thanh toán học phí

**Quyền truy cập:** Member/Student

**URL:** `/dashboard/user-dashboard.html`

---

### 3. Admin User Management
**File:** `admin-user-management.html`

**Chức năng:**
- ✅ Danh sách người dùng
- ✅ Thêm/Sửa/Xóa user
- ✅ Phân quyền
- ✅ Quản lý membership
- ✅ Export/Import data

**Quyền truy cập:** Admin only

**URL:** `/dashboard/admin-user-management.html`

---

### 4. Legacy Dashboard
**File:** `dashboard.html`

**Chức năng:** Dashboard phiên bản cũ (deprecated)

**Trạng thái:** ⚠️ Sẽ được thay thế bởi admin-dashboard-new.html

## 🚀 Cách sử dụng

### Truy cập Dashboard:

**Admin Dashboard:**
```
http://localhost:5500/dashboard/admin-dashboard-new.html
```

**User Dashboard:**
```
http://localhost:5500/dashboard/user-dashboard.html
```

**User Management:**
```
http://localhost:5500/dashboard/admin-user-management.html
```

### Yêu cầu:
1. ✅ Backend đang chạy (http://localhost:3000)
2. ✅ Đã đăng nhập
3. ✅ Có quyền truy cập phù hợp

### Test Dashboard:
```bash
# Mở file test
open dashboard/test-dashboard-flow.html

# Hoặc sử dụng Live Server
npx http-server -p 8080
```

## 🔐 Phân quyền

### Admin Role
- ✅ Truy cập admin-dashboard-new.html
- ✅ Truy cập admin-user-management.html
- ✅ Truy cập user-dashboard.html
- ✅ Xem tất cả dữ liệu
- ✅ Chỉnh sửa tất cả

### Member/Student Role
- ✅ Truy cập user-dashboard.html
- ❌ Không truy cập admin pages
- ✅ Xem dữ liệu cá nhân
- ✅ Chỉnh sửa thông tin cá nhân

### Guest (Not logged in)
- ❌ Redirect to login page
- ❌ Không truy cập dashboard

## 📊 Dashboard Features

### Admin Dashboard Features:

#### 📈 Statistics Cards
- Tổng số thành viên
- Số lớp học đang hoạt động
- Sự kiện sắp tới
- Doanh thu tháng

#### 👥 User Management
- Danh sách người dùng
- Tìm kiếm và filter
- Thêm/Sửa/Xóa
- Phân quyền
- Export data

#### 📅 Class Management
- Danh sách lớp học
- Lịch tập
- Điểm danh
- Quản lý huấn luyện viên

#### 🎉 Event Management
- Danh sách sự kiện
- Tạo sự kiện mới
- Quản lý đăng ký
- Thống kê tham gia

#### 📊 Reports & Analytics
- Báo cáo tài chính
- Thống kê điểm danh
- Phân tích xu hướng
- Export reports

#### ⚙️ System Settings
- Cấu hình hệ thống
- Email templates
- Notification settings
- Backup & restore

---

### User Dashboard Features:

#### 👤 Profile Section
- Thông tin cá nhân
- Ảnh đại diện
- Chỉnh sửa profile
- Đổi mật khẩu

#### 📅 Schedule
- Lịch tập tuần
- Lớp học đã đăng ký
- Lịch sử điểm danh
- Lịch thi đấu

#### 🏆 Achievements
- Thành tích cá nhân
- Huy chương
- Chứng chỉ
- Cấp đai

#### 🔔 Notifications
- Thông báo mới
- Tin nhắn
- Nhắc nhở
- Cập nhật

#### 💰 Payments
- Lịch sử thanh toán
- Học phí
- Hóa đơn
- Phương thức thanh toán

## 🧪 Testing

### Test Files:

#### test-dashboard-flow.html
Test luồng hoạt động của dashboard:
- Login flow
- Navigation
- Data loading
- User interactions

#### test-dashboard-debug.html
Debug dashboard issues:
- Console logs
- Network requests
- State management
- Error handling

#### test-integrated-dashboard.html
Test tích hợp:
- API integration
- Component integration
- Data flow
- Real-time updates

#### test-dashboard-performance.html
Test performance:
- Load time
- Render time
- Memory usage
- Network performance

## 🐛 Common Issues

### Issue 1: Dashboard không load
**Nguyên nhân:** Backend không chạy hoặc không đăng nhập

**Giải pháp:**
```bash
# Khởi động backend
cd backend
npm start

# Đăng nhập lại
# Xóa cache và cookies
```

### Issue 2: Không có quyền truy cập
**Nguyên nhân:** User role không đủ quyền

**Giải pháp:**
- Kiểm tra role trong localStorage
- Đăng nhập với tài khoản admin
- Liên hệ admin để cấp quyền

### Issue 3: Dữ liệu không hiển thị
**Nguyên nhân:** API error hoặc network issue

**Giải pháp:**
- Kiểm tra console log
- Kiểm tra network tab
- Verify API endpoints
- Check backend logs

### Issue 4: Images bị duplicate
**Nguyên nhân:** Logo được load nhiều lần

**Giải pháp:**
- Sử dụng fix-dashboard-image-duplication.html
- Kiểm tra header loading logic
- Clear cache

## 📝 Development Notes

### Adding New Dashboard:
1. Tạo file HTML mới trong folder này
2. Copy structure từ admin-dashboard-new.html
3. Thêm authentication check
4. Thêm role-based access control
5. Test thoroughly

### Modifying Existing Dashboard:
1. Backup file gốc
2. Make changes
3. Test với nhiều roles
4. Check responsive design
5. Verify API calls

### Best Practices:
- ✅ Always check authentication
- ✅ Implement role-based access
- ✅ Handle errors gracefully
- ✅ Show loading states
- ✅ Optimize performance
- ✅ Mobile responsive
- ✅ Accessibility compliant

## 🔗 Related Files

- **Authentication:** `../website/views/account/dang-nhap.html`
- **User Profile:** `../website/views/account/edit.html`
- **Backend API:** `../backend/routes/`
- **Test Suite:** `../test/`

## 📚 Documentation

### API Endpoints:

**Admin Dashboard:**
```
GET /api/admin/dashboard-stats
GET /api/admin/users
GET /api/admin/classes
GET /api/admin/events
```

**User Dashboard:**
```
GET /api/users/profile
GET /api/users/schedule
GET /api/users/achievements
GET /api/users/notifications
```

### Authentication:
```javascript
// Check if user is logged in
const currentUser = localStorage.getItem('currentUser');
if (!currentUser) {
    window.location.href = '../website/views/account/dang-nhap.html';
}

// Check user role
const user = JSON.parse(currentUser);
if (user.role !== 'admin') {
    window.location.href = 'user-dashboard.html';
}
```

## 🎨 UI Components

### Dashboard Cards
```html
<div class="dashboard-card">
    <div class="card-header">
        <div class="card-icon">
            <i class="fas fa-users"></i>
        </div>
        <h3>Card Title</h3>
    </div>
    <div class="card-body">
        <div class="stat-number">123</div>
        <div class="stat-label">Label</div>
    </div>
</div>
```

### Data Tables
```html
<div class="data-table">
    <table>
        <thead>
            <tr>
                <th>Column 1</th>
                <th>Column 2</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Data 1</td>
                <td>Data 2</td>
            </tr>
        </tbody>
    </table>
</div>
```

## 🚦 Status

| File | Status | Last Updated | Notes |
|------|--------|--------------|-------|
| admin-dashboard-new.html | ✅ Active | 2026-02-08 | Production ready |
| user-dashboard.html | ✅ Active | 2026-02-08 | Production ready |
| admin-user-management.html | ✅ Active | 2026-02-08 | Production ready |
| dashboard.html | ⚠️ Deprecated | 2025-12-01 | Use admin-dashboard-new.html |

## 💡 Tips

- Sử dụng admin-dashboard-new.html thay vì dashboard.html
- Test trên nhiều browsers và devices
- Kiểm tra performance với nhiều data
- Implement caching cho better performance
- Use lazy loading cho images và data
- Add error boundaries
- Implement retry logic cho API calls

---

**Lưu ý:** Folder này chứa các file dashboard production và test. Không xóa khi deploy.

**Tác giả:** Kiro AI Assistant  
**Ngày tạo:** 2026-02-08  
**Version:** 1.0.0
