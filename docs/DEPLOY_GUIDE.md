# 🚀 Hướng dẫn Deploy — CLB Võ Cổ Truyền HUTECH

## Checklist trước khi deploy

- [ ] Tạo Gmail App Password mới tại https://myaccount.google.com/apppasswords
- [ ] Cập nhật `SMTP_PASS` trong `backend/.env` trên server
- [ ] DNS đã trỏ về IP server (`vocotruyenhutech.edu.vn` và `api.vocotruyenhutech.edu.vn`)

---

## Bước 1 — Chuẩn bị server (Ubuntu 22.04)

```bash
# Cài Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Cài PM2
sudo npm install -g pm2

# Cài Nginx
sudo apt-get install -y nginx
```

## Bước 2 — Upload code lên server

```bash
# Từ máy local — clone hoặc scp
git clone <repo-url> /var/www/clb-vo
# hoặc
scp -r . user@server:/var/www/clb-vo
```

## Bước 3 — Cấu hình .env production

```bash
cd /var/www/clb-vo/backend

# Copy file template
cp .env.production .env

# Chỉnh sửa — điền SMTP_PASS mới
nano .env
```

**Các giá trị BẮT BUỘC phải điền:**
| Biến | Giá trị |
|------|---------|
| `SMTP_PASS` | Gmail App Password 16 ký tự (tạo mới) |
| `NODE_ENV` | `production` (đã có sẵn) |
| `CORS_ORIGIN` | Domain thực (đã có sẵn) |

## Bước 4 — Deploy backend

```bash
cd /var/www/clb-vo
bash scripts/deploy.sh
```

Script sẽ tự động:
- Cài npm dependencies
- Khởi động PM2 với env production
- Kiểm tra health check
- Reload Nginx

## Bước 5 — Cài SSL

```bash
# Chỉ chạy sau khi DNS đã trỏ về server
bash scripts/setup-ssl.sh
```

## Bước 6 — Cấu hình Nginx cho frontend

```bash
# Tạo thư mục website
mkdir -p /var/www/clb-vo/website

# Copy nginx config (đã làm trong deploy.sh)
# Nginx sẽ serve website/ tại vocotruyenhutech.edu.vn
# và proxy API tại api.vocotruyenhutech.edu.vn → localhost:3001
```

---

## Kiểm tra sau deploy

```bash
# Health check API
curl https://api.vocotruyenhutech.edu.vn/health

# Xem logs
pm2 logs clb-vo-api

# Monitor
pm2 monit
```

---

## Lệnh thường dùng

```bash
# Restart backend
pm2 restart clb-vo-api

# Xem logs realtime
pm2 logs clb-vo-api --lines 50

# Reload Nginx
sudo systemctl reload nginx

# Xem Nginx error log
sudo tail -f /var/log/nginx/error.log
```

---

## Cấu trúc thư mục trên server

```
/var/www/clb-vo/
├── backend/          ← Node.js API (PM2)
│   ├── .env          ← .env.production đã đổi tên
│   ├── server.js
│   └── uploads/      ← Ảnh upload (backup định kỳ!)
├── website/          ← Static files (Nginx serve)
│   ├── index.html
│   ├── admin/
│   ├── views/
│   └── assets/
└── scripts/
    ├── deploy.sh
    └── setup-ssl.sh
```
