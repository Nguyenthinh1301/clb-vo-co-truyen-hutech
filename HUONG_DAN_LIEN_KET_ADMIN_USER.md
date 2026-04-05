# 🔗 Hướng dẫn Hệ thống Liên kết Admin-User Dashboard

## 📋 Tổng quan

Hệ thống cho phép Admin quản lý nội dung (thông báo, tin tức) và User có thể xem được các nội dung này trong Dashboard của mình.

## ✨ Tính năng

### Admin Dashboard
- ✅ Quản lý thông báo (Announcements)
  - Tạo, sửa, xóa thông báo
  - Phân loại: Thông thường, Khẩn cấp, Thông tin, Cảnh báo
  - Độ ưu tiên: Thấp, Bình thường, Cao, Khẩn cấp
  - Đối tượng: Tất cả, Học viên, Huấn luyện viên
  - Thời hạn hiển thị

- ✅ Quản lý tin tức (News)
  - Tạo, sửa, xóa tin tức
  - Danh mục: Chung, Sự kiện, Thành tích, Đào tạo
  - Trạng thái: Nháp, Xuất bản
  - Theo dõi lượt xem

### User Dashboard
- ✅ Xem thông báo mới từ Admin
- ✅ Xem tin tức CLB
- ✅ Thống kê cá nhân
  - Số lớp học đang tham gia
  - Sự kiện sắp tới
  - Tỷ lệ tham gia
  - Thông báo chưa đọc
- ✅ Hoạt động gần đây

## 🚀 Cài đặt

### 1. Chạy Migration Database

```powershell
cd backend
sqlcmd -S "localhost\SQLEXPRESS" -d clb_vo_co_truyen_hutech -U clb_admin -P "CLB@Hutech2026!" -i "database/migrations/create_content_tables.sql"
```

Hoặc chạy trực tiếp trong SQL Server Management Studio:
```sql
-- Mở file: backend/database/migrations/create_content_tables.sql
-- Execute (F5)
```

### 2. Khởi động Backend

```powershell
cd backend
npm start
```

Backend phải chạy để Admin và User có thể tương tác với dữ liệu.

### 3. Đăng nhập

**Admin:**
- URL: `dashboard/dashboard.html`
- Email: admin@hutech.edu.vn
- Password: admin123

**User:**
- URL: `dashboard/user-dashboard.html`
- Email: member@hutech.edu.vn
- Password: member123

## 📖 Hướng dẫn sử dụng

### Dành cho Admin

#### 1. Truy cập Quản lý Nội dung

1. Đăng nhập vào Admin Dashboard
2. Click tab "Nội dung" trên menu
3. Hoặc truy cập trực tiếp: `dashboard/admin-content-management.html`

#### 2. Tạo Thông báo mới

1. Click tab "Thông báo"
2. Click nút "Tạo thông báo mới"
3. Điền thông tin:
   - **Tiêu đề**: Tiêu đề thông báo (bắt buộc)
   - **Nội dung**: Nội dung chi tiết (bắt buộc)
   - **Loại**: Chọn loại thông báo
   - **Độ ưu tiên**: Chọn mức độ ưu tiên
   - **Đối tượng**: Chọn ai sẽ nhìn thấy
   - **Ngày hết hạn**: Tùy chọn, để trống nếu không có hạn
4. Click "Lưu"

**Ví dụ:**
```
Tiêu đề: Thông báo lịch tập mới
Nội dung: Lịch tập tuần này đã được cập nhật. Vui lòng kiểm tra lịch của bạn.
Loại: Thông tin
Độ ưu tiên: Cao
Đối tượng: Học viên
```

#### 3. Tạo Tin tức mới

1. Click tab "Tin tức"
2. Click nút "Tạo tin tức mới"
3. Điền thông tin:
   - **Tiêu đề**: Tiêu đề tin tức (bắt buộc)
   - **Tóm tắt**: Mô tả ngắn gọn
   - **Nội dung**: Nội dung đầy đủ (bắt buộc)
   - **Danh mục**: Chọn danh mục phù hợp
   - **Trạng thái**: 
     - Nháp: Chưa hiển thị cho User
     - Xuất bản: Hiển thị ngay cho User
4. Click "Lưu"

**Ví dụ:**
```
Tiêu đề: CLB đạt giải Nhất tại giải võ thuật sinh viên
Tóm tắt: Thành tích ấn tượng của CLB tại giải đấu
Nội dung: Trong khuôn khổ giải võ thuật sinh viên TP.HCM...
Danh mục: Thành tích
Trạng thái: Xuất bản
```

#### 4. Chỉnh sửa / Xóa

- Click icon ✏️ để chỉnh sửa
- Click icon 🗑️ để xóa (cần xác nhận)

### Dành cho User

#### 1. Xem Dashboard

1. Đăng nhập vào User Dashboard
2. Trang "Tổng quan" hiển thị:
   - Thống kê cá nhân
   - Thông báo mới từ Admin
   - Tin tức CLB
   - Hoạt động gần đây

#### 2. Đọc Thông báo

- Thông báo hiển thị theo độ ưu tiên
- Thông báo khẩn cấp có màu đỏ
- Thông báo quan trọng có màu vàng
- Click "Xem tất cả" để xem đầy đủ

#### 3. Đọc Tin tức

- Tin tức hiển thị dạng card với hình ảnh
- Click vào card để xem chi tiết
- Modal hiển thị nội dung đầy đủ
- Lượt xem được tự động tăng

## 🔄 Luồng dữ liệu

```
Admin tạo/cập nhật nội dung
         ↓
    Backend API
         ↓
    Database (SQL Server)
         ↓
    Backend API
         ↓
User Dashboard tự động tải và hiển thị
```

## 📡 API Endpoints

### Admin APIs

```
GET    /api/admin/content/announcements     - Lấy danh sách thông báo
POST   /api/admin/content/announcements     - Tạo thông báo mới
PUT    /api/admin/content/announcements/:id - Cập nhật thông báo
DELETE /api/admin/content/announcements/:id - Xóa thông báo

GET    /api/admin/content/news               - Lấy danh sách tin tức
POST   /api/admin/content/news               - Tạo tin tức mới
PUT    /api/admin/content/news/:id           - Cập nhật tin tức
DELETE /api/admin/content/news/:id           - Xóa tin tức
```

### User APIs

```
GET /api/user/content/announcements          - Lấy thông báo active
GET /api/user/content/announcements/:id      - Xem chi tiết thông báo
GET /api/user/content/news                   - Lấy tin tức published
GET /api/user/content/news/:id               - Xem chi tiết tin tức
GET /api/user/content/dashboard-stats        - Lấy thống kê dashboard
GET /api/user/content/recent-activities      - Lấy hoạt động gần đây
```

## 🗄️ Database Schema

### Bảng `announcements`
```sql
- id: INT (Primary Key)
- title: NVARCHAR(255)
- content: NVARCHAR(MAX)
- type: NVARCHAR(50) - general, urgent, info, warning
- priority: NVARCHAR(20) - low, normal, high, urgent
- target_audience: NVARCHAR(50) - all, student, instructor
- status: NVARCHAR(20) - active, inactive
- created_by: INT (Foreign Key -> users.id)
- expires_at: DATETIME (nullable)
- created_at: DATETIME
- updated_at: DATETIME
```

### Bảng `news`
```sql
- id: INT (Primary Key)
- title: NVARCHAR(255)
- content: NVARCHAR(MAX)
- excerpt: NVARCHAR(500)
- category: NVARCHAR(50) - general, event, achievement, training
- tags: NVARCHAR(MAX) - JSON array
- featured_image: NVARCHAR(500)
- author_id: INT (Foreign Key -> users.id)
- status: NVARCHAR(20) - draft, published, archived
- views: INT
- published_at: DATETIME
- created_at: DATETIME
- updated_at: DATETIME
```

### Bảng `user_read_announcements`
```sql
- id: INT (Primary Key)
- user_id: INT (Foreign Key -> users.id)
- announcement_id: INT (Foreign Key -> announcements.id)
- read_at: DATETIME
```

## 🎨 Tùy chỉnh

### Thay đổi màu sắc độ ưu tiên

File: `dashboard/css/user-dashboard.css`

```css
.announcement-item.priority-urgent {
    border-left-color: #e74c3c; /* Màu đỏ */
    background: #fee;
}

.announcement-item.priority-high {
    border-left-color: #f39c12; /* Màu vàng */
    background: #fff8e1;
}
```

### Thay đổi số lượng hiển thị

File: `dashboard/js/user-content.js`

```javascript
// Thay đổi limit trong các hàm load
await fetch(`${API_CONFIG.BASE_URL}/api/user/content/announcements?limit=10`)
await fetch(`${API_CONFIG.BASE_URL}/api/user/content/news?limit=12`)
```

## 🔧 Troubleshooting

### Lỗi: Không tải được nội dung

**Nguyên nhân:**
- Backend không chạy
- Token hết hạn
- Lỗi database

**Giải pháp:**
1. Kiểm tra backend đang chạy: http://localhost:3000/health
2. Đăng xuất và đăng nhập lại
3. Kiểm tra console browser (F12) để xem lỗi chi tiết

### Lỗi: Foreign Key constraint khi insert sample data

**Nguyên nhân:**
- Chưa có user với id=1 trong database

**Giải pháp:**
```sql
-- Tạo admin user trước
INSERT INTO users (email, username, password_hash, first_name, last_name, role)
VALUES ('admin@hutech.edu.vn', 'admin', '$2a$12$...', 'Admin', 'User', 'admin');

-- Sau đó chạy lại migration
```

### Lỗi: Thông báo không hiển thị

**Kiểm tra:**
1. Thông báo có status = 'active'
2. Thông báo chưa hết hạn (expires_at)
3. target_audience phù hợp với role của user

## 📝 Best Practices

### Cho Admin

1. **Sử dụng độ ưu tiên hợp lý**
   - Urgent: Chỉ cho thông báo thực sự khẩn cấp
   - High: Thông báo quan trọng
   - Normal: Thông báo thông thường
   - Low: Thông tin phụ

2. **Đặt thời hạn cho thông báo**
   - Thông báo sự kiện: Đặt hết hạn sau ngày sự kiện
   - Thông báo tạm thời: Đặt hết hạn phù hợp

3. **Viết nội dung rõ ràng**
   - Tiêu đề ngắn gọn, súc tích
   - Nội dung đầy đủ thông tin
   - Sử dụng ngôn ngữ dễ hiểu

4. **Phân loại đúng đối tượng**
   - Tránh spam thông báo không liên quan
   - Chỉ gửi cho đối tượng cần thiết

### Cho Developer

1. **Bảo mật**
   - Luôn kiểm tra quyền Admin trước khi cho phép CRUD
   - Validate input từ client
   - Escape HTML để tránh XSS

2. **Performance**
   - Sử dụng pagination cho danh sách dài
   - Cache dữ liệu thường xuyên truy cập
   - Index các cột thường query

3. **UX**
   - Loading state khi fetch data
   - Error handling rõ ràng
   - Responsive design

## 🚀 Tính năng tương lai

- [ ] Real-time notifications với WebSocket
- [ ] Rich text editor cho nội dung
- [ ] Upload hình ảnh cho tin tức
- [ ] Email notifications
- [ ] Push notifications
- [ ] Lọc và tìm kiếm nâng cao
- [ ] Export báo cáo
- [ ] Scheduled publishing
- [ ] Draft auto-save
- [ ] Comments và reactions

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console browser (F12)
2. Kiểm tra backend logs
3. Xem file HUONG_DAN_KHAC_PHUC_LOI_DANG_NHAP.md
4. Liên hệ team phát triển

---

**Phiên bản**: 1.0.0  
**Cập nhật**: 2026-02-18
