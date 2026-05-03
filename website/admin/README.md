# Admin CMS - CLB Võ Cổ Truyền HUTECH

Hệ thống quản lý nội dung (CMS) cho website CLB.

## Cấu trúc

```
website/admin/
├── index.html          ← Trang đăng nhập
├── dashboard.html      ← Tổng quan
├── tin-tuc.html        ← Quản lý tin tức (CRUD)
├── su-kien.html        ← Quản lý sự kiện (CRUD)
├── thong-bao.html      ← Quản lý thông báo (CRUD)
└── shared/
    ├── auth.js         ← Xử lý authentication
    ├── api.js          ← Gọi backend API
    ├── ui.js           ← UI helpers (toast, sidebar, format...)
    └── style.css       ← CSS dùng chung
```

## Cách chạy

### Bước 1: Khởi động Backend

```bash
cd backend
node server.js
```

Backend sẽ chạy tại `http://localhost:3001`

### Bước 2: Khởi động Website Server

**Cách 1 — Dùng serve.js (khuyến nghị):**
```bash
node serve.js
```
Mở: `http://localhost:8080/admin/`

**Cách 2 — Dùng Go Live (VS Code):**
- Click chuột phải vào `website/admin/index.html`
- Chọn "Open with Live Server"
- Mở: `http://127.0.0.1:5505/website/admin/index.html`

## Thông tin đăng nhập

- **Email:** `admin@vocotruyenhutech.edu.vn`
- **Password:** `Hutech@2026`

## Tính năng

### Dashboard
- Hiển thị tổng số tin tức, sự kiện, thông báo
- Danh sách tin tức và sự kiện gần đây
- Các thao tác nhanh

### Quản lý Tin tức
- Xem danh sách tin tức (có phân trang)
- Lọc theo trạng thái (Đã đăng / Nháp)
- Thêm tin tức mới
- Chỉnh sửa tin tức
- Xóa tin tức

### Quản lý Sự kiện
- Xem danh sách sự kiện
- Thêm sự kiện mới (tên, mô tả, ngày, địa điểm, trạng thái)
- Chỉnh sửa sự kiện
- Xóa sự kiện

### Quản lý Thông báo
- Xem danh sách thông báo
- Thêm thông báo mới (tiêu đề, nội dung, loại, độ ưu tiên)
- Chỉnh sửa thông báo
- Xóa thông báo

## Backend API

Tất cả endpoint CMS nằm trong `backend/routes/admin-cms.js`:

- `GET /api/cms/news` — Lấy danh sách tin tức (public)
- `POST /api/cms/news` — Tạo tin tức mới (admin only)
- `PUT /api/cms/news/:id` — Cập nhật tin tức (admin only)
- `DELETE /api/cms/news/:id` — Xóa tin tức (admin only)

Tương tự cho `/api/cms/events` và `/api/cms/announcements`.

## Kiến trúc

- **index.html** — Hoàn toàn độc lập, không import file shared nào. Xử lý login và lưu token vào `localStorage`.
- **Các trang khác** — Import `shared/auth.js`, `shared/api.js`, `shared/ui.js`. Kiểm tra token khi load, nếu không hợp lệ hiển thị thông báo "Phiên đăng nhập hết hạn".
- **Không có redirect loop** — `index.html` không check token, các trang khác không tự redirect về login.

## Troubleshooting

**Lỗi "Không kết nối được backend":**
- Kiểm tra backend đang chạy: `http://localhost:3001/health`
- Kiểm tra CORS: backend phải ở `NODE_ENV=development` trong `.env`

**Lỗi "Phiên đăng nhập hết hạn":**
- Đăng nhập lại tại `index.html`
- Token được lưu trong `localStorage` với key `adm_tk`

**Lỗi 401 khi POST/PUT/DELETE:**
- Token hết hạn hoặc không hợp lệ
- Đăng nhập lại để lấy token mới
