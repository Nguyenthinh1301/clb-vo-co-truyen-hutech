# 🆓 Deploy miễn phí — Render + Neon

Hướng dẫn deploy dự án lên **Render.com** (backend) + **Neon.tech** (PostgreSQL) + **Netlify** (frontend) — hoàn toàn miễn phí.

---

## Bước 1 — Tạo database PostgreSQL (Neon.tech)

1. Vào [neon.tech](https://neon.tech) → Sign up (dùng GitHub)
2. **Create Project**:
   - Project name: `clb-vo-hutech`
   - Region: **Singapore** (gần VN nhất)
   - PostgreSQL version: **16**
3. Copy **Connection String** (dạng `postgresql://user:pass@host.neon.tech/dbname?sslmode=require`)
4. Vào **SQL Editor** → paste nội dung file `backend/database/pg-schema.sql` → Run

---

## Bước 2 — Deploy backend (Render.com)

1. Vào [render.com](https://render.com) → Sign up (dùng GitHub)
2. **New** → **Web Service**
3. Connect GitHub repo của bạn
4. Cấu hình:
   - **Name**: `clb-vo-api`
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. **Environment Variables** — thêm các biến sau:

```env
NODE_ENV=production
PORT=3001
DB_TYPE=postgres
DATABASE_URL=<paste_connection_string_từ_Neon>

JWT_SECRET=<chuỗi ngẫu nhiên 128 ký tự — xem lệnh tạo trong backend/.env.example>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<tạo chuỗi ngẫu nhiên khác JWT_SECRET>
JWT_REFRESH_EXPIRES_IN=30d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vctht2026@gmail.com
SMTP_PASS=<mật khẩu ứng dụng Gmail>
FROM_EMAIL=vctht2026@gmail.com
FROM_NAME=CLB Võ Cổ Truyền HUTECH

CORS_ORIGIN=https://clb-vo-hutech.netlify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
```

6. Click **Create Web Service** → đợi deploy (3-5 phút)
7. Sau khi deploy xong, copy **URL** (dạng `https://clb-vo-api.onrender.com`)

---

## Bước 3 — Tạo admin user trong database

1. Quay lại **Neon SQL Editor**
2. Chạy query sau (thay `<password_hash>` bằng bcrypt hash):

```sql
-- Tạo admin user
INSERT INTO users (
    email, username, password, first_name, last_name, full_name,
    role, membership_status, is_active, email_verified
) VALUES (
    'admin@vocotruyenhutech.edu.vn',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIeWEgEn4e',
    'Admin',
    'HUTECH',
    'Admin HUTECH',
    'admin',
    'active',
    TRUE,
    TRUE
);
```

**Password mặc định:** `<mật khẩu admin>` (hash trên)

---

## Bước 4 — Deploy frontend (Netlify)

1. Vào [netlify.com](https://netlify.com) → Sign up (dùng GitHub)
2. **Add new site** → **Import from Git**
3. Chọn repo GitHub
4. Cấu hình:
   - **Base directory**: `website`
   - **Build command**: (để trống)
   - **Publish directory**: `.`
5. Click **Deploy**
6. Sau khi deploy xong, copy **URL** (dạng `https://clb-vo-hutech.netlify.app`)

---

## Bước 5 — Cập nhật CORS và config.js

1. Quay lại **Render** → Environment → sửa `CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://clb-vo-hutech.netlify.app
   ```

2. Sửa `website/assets/js/config.js` — dòng 12:
   ```javascript
   var PRODUCTION_API_BASE = 'https://clb-vo-api.onrender.com/api';
   ```

3. Commit + push lên GitHub → Netlify tự động deploy lại

---

## Bước 6 — Test

1. Vào `https://clb-vo-hutech.netlify.app`
2. Đợi 20-30 giây lần đầu (Render free tier ngủ sau 15 phút không dùng)
3. Test:
   - Trang chủ load
   - Tin tức, sự kiện hiển thị
   - Form liên hệ gửi được
   - Admin login: `admin@vocotruyenhutech.edu.vn` / `<mật khẩu admin>`

---

## Lưu ý với free tier

- **Render**: server ngủ sau 15 phút → lần đầu load chậm 20-30s
- **Neon**: database free 0.5GB, đủ cho test
- **Netlify**: không giới hạn, load nhanh

**Khi nào cần upgrade lên VPS:**
- Nhiều người dùng cùng lúc
- Cần uptime 24/7
- Cần domain riêng
- Cần upload nhiều ảnh (>500MB)

---

## Troubleshooting

**Backend không start:**
- Xem logs tại Render Dashboard → Logs
- Kiểm tra `DATABASE_URL` đã đúng chưa

**Frontend không kết nối backend:**
- Kiểm tra `CORS_ORIGIN` trong Render
- Kiểm tra `PRODUCTION_API_BASE` trong `config.js`

**Database lỗi:**
- Kiểm tra đã chạy `pg-schema.sql` trong Neon chưa
- Kiểm tra connection string có `?sslmode=require` chưa
