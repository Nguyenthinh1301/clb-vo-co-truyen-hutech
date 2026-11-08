# Triển khai (Deploy)

| Phần | Dịch vụ | Cách deploy |
|---|---|---|
| Website + trang quản trị (`website/`) | **Netlify** | Tự động khi push nhánh `main` (cấu hình trong `netlify.toml`, không có bước build) |
| Backend API (`backend/`) | **Render** – Web Service gói miễn phí | Tự động khi push `main` (nếu tắt Auto-Deploy: *Manual Deploy → Deploy latest commit*) |
| Database | **Neon** – PostgreSQL | Tạo bảng bằng `backend/database/pg-schema.sql` |
| Ảnh tải lên từ admin | **Cloudinary** | Bắt buộc trên Render: ổ đĩa Render bị xóa mỗi lần deploy |

## Render — cấu hình service

Cấu hình phù hợp với cấu trúc repo (đối chiếu với Render → Settings khi tạo service mới):

- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

### Biến môi trường (Render → Environment)

**Bắt buộc**

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `DB_TYPE` | `postgres` |
| `DATABASE_URL` | Connection string của Neon (`postgresql://…?sslmode=require`) |
| `JWT_SECRET` | Chuỗi ngẫu nhiên 128 ký tự — `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên **khác** `JWT_SECRET` |
| `CORS_ORIGIN` | `https://vocotruyenhutech.netlify.app` (nhiều domain: phân cách bằng dấu phẩy) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Từ trang Cloudinary → Settings → API Keys |

**Nên có**

| Biến | Giá trị / ý nghĩa |
|---|---|
| `RATE_LIMIT_MAX_REQUESTS` | `300` — số request tối đa mỗi người / 15 phút. **Đừng để quá thấp**: mỗi lần mở Dashboard admin ≈ 9 request |
| `RESEND_API_KEY` | API key của [Resend](https://resend.com) — gửi email trả lời liên hệ, thông báo cho admin |
| `RESEND_FROM_EMAIL` | Địa chỉ gửi đã xác minh trên Resend (mặc định `onboarding@resend.dev`) |
| `ADMIN_NOTIFY_EMAIL` | Email nhận thông báo khi có tin nhắn liên hệ mới |
| `FROM_NAME` | Tên người gửi email (mặc định `CLB Võ Cổ Truyền HUTECH`) |
| `ADMIN_URL` | `https://vocotruyenhutech.netlify.app` — dùng cho link trong email gửi admin |

**Tùy chọn**

| Biến | Ý nghĩa |
|---|---|
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Chỉ dùng khi DB **chưa có** admin: server tự tạo lúc khởi động. Không đổi mật khẩu admin đã có |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Thời hạn token (mặc định `7d` / `30d`) |
| `TRUST_CF_CONNECTING_IP` | Mặc định bật: rate limit theo IP thật từ header Cloudflare. Đặt `false` nếu deploy nơi không có Cloudflare |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` | Gửi mail qua SMTP — chỉ dùng khi **không** có `RESEND_API_KEY` |
| `PG_POOL_MAX`, `LOG_LEVEL` | Số kết nối DB tối đa (mặc định 10), mức log |

> Đổi `JWT_SECRET` sẽ đăng xuất toàn bộ người dùng — bình thường, đăng nhập lại là được.

## Netlify

`netlify.toml` đã cấu hình sẵn: publish thư mục `website`, header bảo mật, và chuyển hướng 301 các trang Thông báo cũ
(chức năng đã bỏ) sang trang thay thế. Địa chỉ backend production khai báo trong `website/assets/js/config.js`
(`PRODUCTION_API_BASE`) — đổi domain backend thì sửa ở đó.

## Render gói miễn phí "ngủ"

Không có truy cập ~15 phút, Render tắt service; request đầu tiên sau đó mất ~1 phút để khởi động
(trang đăng nhập admin hiện "Máy chủ đang khởi động…" và tự thử lại).

- Backend **tự ping chính nó mỗi 14 phút** khi `NODE_ENV=production` (`services/schedulerService.js`).
- Để chắc chắn hơn: tạo job miễn phí trên [cron-job.org](https://cron-job.org) hoặc UptimeRobot gọi
  `https://clb-vo-co-truyen-hutech.onrender.com/health` mỗi 10 phút.
  (Hoặc chạy tay `node backend/scripts/keep-alive.js` / `scripts/keep-alive-production.ps1`.)

## Kiểm tra sau khi deploy

```powershell
.\scripts\verify-production.ps1
```

Hoặc thủ công: `/health` trả `"success": true` và `"database": {"success": true}`; mở trang chủ và đăng nhập admin.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Lỗi **429** "Quá nhiều yêu cầu" | Vượt `RATE_LIMIT_MAX_REQUESTS` trong 15 phút | Tăng biến này (khuyến nghị 300); header `ratelimit-remaining` cho biết số lượt còn lại |
| Trang mở rất chậm lần đầu | Render đang ngủ | Đợi ~1 phút; xem mục keep-alive ở trên |
| Lỗi CORS khi gọi API | Domain frontend chưa có trong `CORS_ORIGIN` | Thêm domain vào `CORS_ORIGIN` (localhost mọi cổng luôn được phép) |
| Ảnh tải lên bị mất sau vài ngày | Chưa cấu hình Cloudinary → ảnh lưu trên ổ Render | Đặt 3 biến `CLOUDINARY_*` rồi tải ảnh lại |
| Email không gửi được | Thiếu `RESEND_API_KEY` hoặc key bị thu hồi | Tạo key mới trên Resend, cập nhật biến |
| Không đăng nhập được admin | Sai / quên mật khẩu | Xem [ADMIN-GUIDE.md](ADMIN-GUIDE.md#quên-mật-khẩu-admin) |
