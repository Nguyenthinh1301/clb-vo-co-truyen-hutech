# ✅ CHECKLIST TRIỂN KHAI - HỆ THỐNG HYBRID

**Ngày**: 2026-03-06  
**Trạng thái**: Đã hoàn thành chuyển đổi sang mô hình Hybrid

---

## 📋 KIỂM TRA TRƯỚC KHI DEPLOY

### 1. Website Công Khai ✅

- [x] Đã xóa menu "Thành viên" khỏi header
- [x] Đã xóa link đăng nhập/đăng ký
- [x] Đã xóa script `auth.js` khỏi index.html
- [x] Đã đổi CTA "Đăng ký ngay" → "Liên hệ ngay"
- [x] Đã xóa logic `updateAuthMenu()`
- [ ] Test website trên trình duyệt
- [ ] Test responsive trên mobile
- [ ] Test form liên hệ
- [ ] Kiểm tra tất cả links hoạt động

### 2. Hệ Thống Quản Trị ✅

- [x] Dashboard vẫn hoạt động bình thường
- [x] Backend API vẫn hoạt động
- [ ] Test đăng nhập admin
- [ ] Test các chức năng quản lý
- [ ] Kiểm tra database connection
- [ ] Test tạo thành viên mới

### 3. Backup & Documentation ✅

- [x] Đã backup code cũ
- [x] Đã tạo `ADMIN_ACCESS_GUIDE.md`
- [x] Đã tạo `PUBLIC_WEBSITE_README.md`
- [x] Đã tạo `MIGRATION_SUMMARY.md`
- [x] Đã tạo `DEPLOYMENT_CHECKLIST.md`

---

## 🚀 HƯỚNG DẪN DEPLOY

### A. Deploy Website Công Khai (Netlify - Miễn phí)

#### Bước 1: Chuẩn bị code

```bash
# Tạo thư mục deploy riêng cho website
mkdir deploy-website
cp -r website/* deploy-website/
cd deploy-website
```

#### Bước 2: Tạo file netlify.toml

```toml
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Bước 3: Deploy

1. Push code lên GitHub (repo riêng cho website)
2. Đăng nhập Netlify: https://app.netlify.com/
3. "New site from Git"
4. Chọn repository
5. Build settings:
   - Build command: (để trống)
   - Publish directory: `.`
6. Click "Deploy site"

#### Bước 4: Cấu hình domain (tùy chọn)

1. Netlify Dashboard → Domain settings
2. Add custom domain: `vct.hutech.edu.vn`
3. Cấu hình DNS theo hướng dẫn

### B. Deploy Backend + Dashboard (VPS/Cloud)

#### Option 1: VPS (DigitalOcean, Vultr, Linode)

**Yêu cầu:**
- Ubuntu 20.04+
- 2GB RAM
- Node.js 18+
- SQL Server hoặc PostgreSQL

**Các bước:**

```bash
# 1. SSH vào VPS
ssh root@your-server-ip

# 2. Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Cài đặt PM2
npm install -g pm2

# 4. Clone code
git clone https://github.com/your-repo.git
cd your-repo

# 5. Cài đặt dependencies
cd backend
npm install

# 6. Cấu hình environment
cp .env.example .env
nano .env  # Chỉnh sửa các biến môi trường

# 7. Khởi động backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 8. Cài đặt Nginx
sudo apt install nginx

# 9. Cấu hình Nginx
sudo nano /etc/nginx/sites-available/vct-hutech
```

**Nginx config:**

```nginx
server {
    listen 80;
    server_name api.vct-hutech.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Dashboard (bảo mật)
    location /dashboard {
        alias /var/www/vct-hutech/dashboard;
        try_files $uri $uri/ /dashboard/dashboard.html;
        
        # IP Whitelist (tùy chọn)
        # allow 123.45.67.89;  # IP trường
        # deny all;
    }
}
```

```bash
# 10. Enable site
sudo ln -s /etc/nginx/sites-available/vct-hutech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 11. Cài đặt SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.vct-hutech.com
```

#### Option 2: Docker (Khuyến nghị)

```bash
# 1. Build và chạy
docker-compose up -d

# 2. Kiểm tra logs
docker-compose logs -f

# 3. Stop
docker-compose down
```

---

## 🔒 BẢO MẬT

### 1. Đổi URL Dashboard (Khuyến nghị cao)

```bash
# Đổi tên thư mục
mv dashboard admin-portal-hutech-2025

# Cập nhật tất cả links trong code
# Tìm và thay thế: /dashboard/ → /admin-portal-hutech-2025/
```

### 2. Thêm IP Whitelist

**File: `backend/middleware/ipWhitelist.js`**

```javascript
const allowedIPs = [
    '123.45.67.89',  // IP trường HUTECH
    '::1',           // localhost
    '127.0.0.1'      // localhost
];

module.exports = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.includes(clientIP)) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied' });
    }
};
```

**Áp dụng cho dashboard routes:**

```javascript
// backend/server.js
const ipWhitelist = require('./middleware/ipWhitelist');

app.use('/dashboard', ipWhitelist, express.static('dashboard'));
```

### 3. Đổi mật khẩu admin mặc định

```sql
-- Đăng nhập database và chạy:
UPDATE users 
SET password = 'hashed_new_password' 
WHERE email = 'admin@hutech.edu.vn';
```

### 4. Cấu hình CORS

```javascript
// backend/server.js
const cors = require('cors');

app.use(cors({
    origin: [
        'https://vct.hutech.edu.vn',  // Website công khai
        'https://api.vct-hutech.com'  // Dashboard
    ],
    credentials: true
}));
```

---

## 🧪 TESTING

### Test Website Công Khai

```bash
# Local
http://localhost:3000/website/index.html

# Production
https://vct.hutech.edu.vn
```

**Checklist:**
- [ ] Trang chủ load đúng
- [ ] Không có menu "Thành viên"
- [ ] Không có link đăng nhập/đăng ký
- [ ] CTA button là "Liên hệ ngay"
- [ ] Form liên hệ hoạt động
- [ ] Responsive trên mobile
- [ ] Tất cả hình ảnh load
- [ ] Navigation hoạt động

### Test Dashboard

```bash
# Local
http://localhost:3000/dashboard/dashboard.html

# Production
https://api.vct-hutech.com/dashboard/dashboard.html
```

**Checklist:**
- [ ] Đăng nhập thành công
- [ ] Dashboard load đúng
- [ ] Quản lý thành viên hoạt động
- [ ] Quản lý lớp học hoạt động
- [ ] Quản lý sự kiện hoạt động
- [ ] Điểm danh hoạt động
- [ ] Quản lý điểm số hoạt động
- [ ] Thông báo hoạt động

### Test Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hutech.edu.vn","password":"Admin@123"}'
```

---

## 📊 MONITORING

### 1. Cài đặt monitoring tools

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Uptime monitoring
# Đăng ký tại: https://uptimerobot.com/
# Thêm monitors cho:
# - Website: https://vct.hutech.edu.vn
# - API: https://api.vct-hutech.com/api/health
```

### 2. Logs

```bash
# Backend logs
pm2 logs backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 BACKUP

### 1. Database backup (Hàng ngày)

```bash
# Tạo script backup
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
DB_NAME="vct_hutech"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Giữ lại 7 ngày gần nhất
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql"
```

```bash
# Cấp quyền thực thi
chmod +x /root/backup-db.sh

# Thêm vào crontab (chạy lúc 2h sáng hàng ngày)
crontab -e
# Thêm dòng:
0 2 * * * /root/backup-db.sh
```

### 2. Code backup

```bash
# Backup code hàng tuần
0 3 * * 0 tar -czf /root/backups/code_$(date +\%Y\%m\%d).tar.gz /var/www/vct-hutech
```

---

## 📞 SUPPORT

### Liên hệ khi gặp vấn đề:

**Technical Issues:**
- Email: [email hỗ trợ]
- Phone: [số điện thoại]
- Telegram: [link group]

**Emergency:**
- Hotline: [số hotline]
- On-call: [số on-call]

---

## 📝 POST-DEPLOYMENT

### Sau khi deploy thành công:

- [ ] Thông báo cho admin về URL mới
- [ ] Gửi hướng dẫn sử dụng
- [ ] Training cho admin
- [ ] Cập nhật DNS (nếu có domain)
- [ ] Cấu hình SSL certificate
- [ ] Setup monitoring
- [ ] Setup backup tự động
- [ ] Test toàn bộ hệ thống
- [ ] Document lại các thay đổi

---

## ✅ HOÀN THÀNH

Khi tất cả checklist đã được đánh dấu ✅, hệ thống đã sẵn sàng production!

**Ngày deploy**: _______________  
**Người deploy**: _______________  
**Trạng thái**: ⬜ Thành công | ⬜ Có vấn đề

---

**Lưu ý**: Giữ file này để tham khảo cho các lần deploy sau!
