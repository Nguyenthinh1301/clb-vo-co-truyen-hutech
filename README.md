# CLB Võ Cổ Truyền HUTECH — Website & Backend

Website chính thức và trang quản trị (CMS) của Câu Lạc Bộ Võ Cổ Truyền, Trường Đại học Công nghệ TP.HCM (HUTECH).

| | Địa chỉ | Chạy trên |
|---|---|---|
| Website | https://vocotruyenhutech.netlify.app | Netlify (tự deploy khi push `main`) |
| Trang quản trị | https://vocotruyenhutech.netlify.app/admin/ | Netlify |
| Backend API | https://clb-vo-co-truyen-hutech.onrender.com | Render (gói miễn phí) + PostgreSQL (Neon) |

## Cấu trúc thư mục

```
├── website/                  Frontend tĩnh (HTML/CSS/JS thuần, không cần build)
│   ├── index.html            Trang chủ — nạp các section trong components/
│   ├── components/           Header, hero, giới thiệu, lịch tập, thư viện, liên hệ, footer…
│   ├── views/                Các trang con (giới thiệu, tin tức, sự kiện, thư viện, liên hệ…)
│   ├── admin/                Trang quản trị (đăng nhập, dashboard, tin tức, sự kiện, thành viên…)
│   │   └── shared/           auth.js · api.js · ui.js · style.css dùng chung cho admin
│   ├── assets/               CSS từng trang, js/config.js (chọn địa chỉ API), hình ảnh, video
│   ├── styles.css            CSS chính · styles-enhanced.css: hiệu ứng / responsive bổ sung
│   └── script.js             JS chính · script-enhanced.js: hiệu ứng cuộn, đếm số, ảnh lazy
├── backend/                  API Node.js + Express
│   ├── server.js             Điểm khởi động: middleware, CORS, rate limit, gắn routes
│   ├── config/               Kết nối DB (PostgreSQL / SQL Server / MySQL, chọn bằng DB_TYPE)
│   ├── routes/               Các API: auth, users, admin-cms, gallery, contact, events…
│   ├── middleware/           Xác thực JWT, kiểm tra dữ liệu, xử lý lỗi
│   ├── services/             Email, cache, log, lịch chạy định kỳ, websocket…
│   ├── database/             Schema SQL (pg-schema.sql là bản dùng cho production) + migrations
│   ├── scripts/              Tiện ích: đặt lại mật khẩu admin, khởi tạo DB, keep-alive
│   └── tests/                Test API (không cần DB thật) — chạy bằng `npm test`
├── scripts/                  Script PowerShell: khởi động local, kiểm tra production
├── docs/                     Tài liệu
└── netlify.toml              Cấu hình Netlify (thư mục publish, header bảo mật, chuyển hướng)
```

## Bắt đầu nhanh (máy local)

```bash
# Backend
cd backend
cp .env.example .env        # điền thông tin DB + JWT_SECRET
npm install
npm run dev                 # http://localhost:3001  (kiểm tra: /health)
```

Frontend là HTML tĩnh: mở thư mục `website/` bằng **Live Server** (VS Code) hoặc bất kỳ web server tĩnh nào.
Khi mở từ `localhost`, trang tự gọi backend ở `http://localhost:3001`.
Không muốn chạy backend trên máy? Ở trang đăng nhập admin bấm **"Dùng máy chủ thật"** để gọi backend production
(xem [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)).

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Chạy local, cấu trúc code, quy ước, test |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy Render + Netlify, biến môi trường, xử lý sự cố |
| [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) | Hướng dẫn dùng trang quản trị, đặt lại mật khẩu admin |
| [docs/MSSQL_SETUP.md](docs/MSSQL_SETUP.md) | Chạy với SQL Server thay cho PostgreSQL (tùy chọn) |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Kế hoạch tính năng |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Lịch sử thay đổi |

## Bảo mật

- Repo này **công khai** — không bao giờ commit `.env`, mật khẩu, API key, token. Bí mật chỉ đặt trong **Render → Environment**.
- Không có mật khẩu admin mặc định trong code. Quên mật khẩu: xem [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md#quên-mật-khẩu-admin).
