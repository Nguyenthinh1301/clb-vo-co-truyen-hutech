# Phát triển trên máy local

## 1. Chỉ sửa giao diện (không cần chạy backend)

1. Mở thư mục `website/` bằng **Live Server** trong VS Code (chuột phải `index.html` → *Open with Live Server*).
2. Trang chạy ở `http://127.0.0.1:5500` và mặc định gọi backend local `http://localhost:3001` — chưa chạy thì các phần dữ liệu (tin tức, sự kiện, thư viện ảnh) sẽ trống.
3. Để dùng dữ liệu thật: mở `http://127.0.0.1:5500/admin/` → bấm **"Dùng máy chủ thật"**.
   Lựa chọn này lưu trong trình duyệt (`localStorage.API_TARGET = 'production'`) và áp dụng cho **mọi trang** khi mở từ máy local.
   Muốn quay về backend local: bấm **"Chuyển về backend local"** ở trang đăng nhập admin, hoặc chạy trong Console:
   `localStorage.removeItem('API_TARGET')`.

> ⚠️ Khi dùng máy chủ thật, mọi thao tác trong trang admin (sửa, xóa…) tác động lên **dữ liệu thật**.

Logic chọn địa chỉ API nằm ở `website/assets/js/config.js` — mọi trang đều đọc `window.APP_CONFIG.API_BASE`.

## 2. Chạy backend

Yêu cầu: Node.js 18+ và một database (PostgreSQL khuyến nghị — giống production; SQL Server/MySQL cũng được).

```bash
cd backend
cp .env.example .env
npm install
npm run dev            # nodemon, tự khởi động lại khi sửa code
```

Biến tối thiểu trong `.env`:

```env
NODE_ENV=development
PORT=3001
DB_TYPE=postgres                     # postgres | mssql | mysql
DATABASE_URL=postgresql://user:pass@localhost:5432/clb_vo   # khi DB_TYPE=postgres
JWT_SECRET=<chuỗi ngẫu nhiên>        # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác>
ADMIN_PASSWORD=<mật khẩu admin cho DB mới>   # chỉ dùng khi DB chưa có admin
```

- Tạo bảng cho PostgreSQL: chạy `backend/database/pg-schema.sql` (đủ 23 bảng).
- Lần khởi động đầu, server tự tạo tài khoản admin (`ADMIN_EMAIL`, mặc định `admin@vocotruyenhutech.edu.vn`) nếu DB chưa có.
- Kiểm tra: `http://localhost:3001/health` · tài liệu API (chỉ ở development): `http://localhost:3001/api-docs`.
- Script tiện (PowerShell): `scripts/start-backend-simple.ps1` (khởi động backend), `scripts/check-backend.ps1` (kiểm tra và khởi động nếu chưa chạy).

## 3. Test

```bash
cd backend
npm test
```

Test nằm ở `backend/tests/api.test.js`, dùng **database giả** (`tests/helpers/fakeDb.js`) nên không cần DB thật.
Chúng bao phủ các lỗi từng xảy ra trên production (lộ tin nháp, rate limit, thống kê liên hệ, quy tắc xóa thành viên…).
Khi sửa route nào, nên thêm test tương ứng.

## 4. Quy ước code

**Frontend**
- HTML/CSS/JS thuần, không build. Trang chủ nạp các file trong `components/` bằng `fetch` rồi phát sự kiện
  `components:loaded` — code cần chạm vào các section phải đợi sự kiện này (xem `script-enhanced.js`).
- Bảng màu theo logo: xanh `#1450a3`, navy `#0a2a5e` / `#0f3570`, vàng `#ffd500`, trắng.
  Màu đỏ chỉ dùng cho cảnh báo / nút nguy hiểm (xóa, hủy, đăng xuất, thông báo lỗi).
- Dữ liệu từ API (tên, email, nội dung người dùng nhập) chèn vào trang phải qua `escapeHtml()` (admin: `shared/ui.js`).

**Backend**
- Chỉ dùng SQL chạy được trên cả PostgreSQL / SQL Server / MySQL qua `db.find`, `db.findOne`, `db.insert`, `db.update`,
  `db.delete` (adapter tự đổi `?`, `LIMIT`, `true/false`, `NOW()`…). Tránh hàm riêng của một DB như `DATEDIFF(HOUR, …)`.
- Route quản trị: `authenticate` + `authorize('admin')` (kiểm tra phiên trong DB) hoặc `authenticateJwt` + `requireAdmin`.
- Lỗi 500 trả thông báo chung, chi tiết ghi vào log server.
- Rate limit tính theo IP thật của người dùng (`utils/clientIp.js`, header `CF-Connecting-IP` của Cloudflare).

## 5. Git

- Nhánh chính: `main` — push lên là Netlify và Render tự deploy.
- Thay đổi lớn: tạo nhánh riêng, kiểm tra trên máy rồi mới merge.
- Đăng nhập GitHub qua Git Credential Manager (cửa sổ đăng nhập tự hiện khi push). **Không** dán token vào URL remote.
