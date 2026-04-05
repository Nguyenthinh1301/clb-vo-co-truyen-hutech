# 🚀 Deployment Guide - CLB Võ Cổ Truyền HUTECH Backend

Hướng dẫn triển khai backend API lên môi trường production.

## 📋 Mục lục

1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Triển khai với PM2](#triển-khai-với-pm2)
3. [Triển khai với Docker](#triển-khai-với-docker)
4. [Cấu hình Nginx](#cấu-hình-nginx)
5. [Monitoring & Logging](#monitoring--logging)
6. [Backup & Recovery](#backup--recovery)

---

## Yêu cầu hệ thống

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 20GB
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Node.js**: v18.x hoặc cao hơn
- **MySQL**: v8.0 hoặc cao hơn

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Node.js**: v20.x
- **MySQL**: v8.0

---

## Triển khai với PM2

PM2 là process manager cho Node.js applications, hỗ trợ cluster mode và auto-restart.

### 1. Cài đặt PM2

```bash
npm install -g pm2
```

### 2. Cấu hình Environment

Tạo file `.env` cho production:

```bash
cp .env.example .env
nano .env
```

Cập nhật các giá trị:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clb_vo_co_truyen_hutech
DB_USER=your_db_user
DB_PASSWORD=your_strong_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Khởi động với PM2

```bash
# Start application
npm run pm2:start

# Check status
pm2 status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop
```

### 4. PM2 Startup Script

Để PM2 tự động khởi động khi server reboot:

```bash
pm2 startup
pm2 save
```

### 5. PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (optional)
pm2 install pm2-server-monit
```

---

## Triển khai với Docker

Docker giúp đóng gói ứng dụng và dependencies vào container.

### 1. Cài đặt Docker

**Ubuntu:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Docker Compose:**
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Cấu hình Environment

Tạo file `.env` trong thư mục backend:

```env
DB_NAME=clb_vo_co_truyen_hutech
DB_USER=clb_user
DB_PASSWORD=your_strong_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
PORT=3000
```

### 3. Build và Run

```bash
# Build Docker image
npm run docker:build

# Start all services (API + MySQL + Redis)
npm run docker:run

# View logs
npm run docker:logs

# Stop all services
npm run docker:stop
```

### 4. Docker Commands

```bash
# Build image manually
docker build -t clb-vo-api .

# Run container
docker run -d -p 3000:3000 --name clb-vo-api clb-vo-api

# View logs
docker logs -f clb-vo-api

# Stop container
docker stop clb-vo-api

# Remove container
docker rm clb-vo-api
```

### 5. Docker Compose Services

Docker Compose sẽ khởi động các services:

- **api**: Backend API server (port 3000)
- **mysql**: MySQL database (port 3306)
- **redis**: Redis cache (port 6379)
- **nginx**: Reverse proxy (port 80, 443)

---

## Cấu hình Nginx

Nginx làm reverse proxy và load balancer cho API.

### 1. Cài đặt Nginx

**Ubuntu:**
```bash
sudo apt update
sudo apt install nginx
```

### 2. Cấu hình Nginx

Copy file cấu hình:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/clb-vo-api
sudo ln -s /etc/nginx/sites-available/clb-vo-api /etc/nginx/sites-enabled/
```

Hoặc chỉnh sửa trực tiếp:

```bash
sudo nano /etc/nginx/sites-available/clb-vo-api
```

### 3. SSL Certificate (HTTPS)

**Sử dụng Let's Encrypt:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. Test và Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

### 5. Nginx Status

```bash
# Check status
sudo systemctl status nginx

# Enable auto-start
sudo systemctl enable nginx
```

---

## Monitoring & Logging

### 1. Application Logs

Logs được lưu trong thư mục `logs/`:

```bash
# View error logs
tail -f logs/error.log

# View combined logs
tail -f logs/combined.log

# View PM2 logs
pm2 logs
```

### 2. Health Checks

API cung cấp các health check endpoints:

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed

# Readiness check
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live
```

### 3. Database Monitoring

```bash
# MySQL status
mysql -u root -p -e "SHOW PROCESSLIST;"

# Database size
mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES GROUP BY table_schema;"
```

### 4. System Monitoring

```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# Network connections
netstat -tulpn | grep :3000
```

---

## Backup & Recovery

### 1. Database Backup

**Manual Backup:**

```bash
# Backup database
mysqldump -u root -p clb_vo_co_truyen_hutech > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
mysql -u root -p clb_vo_co_truyen_hutech < backup_20240101_120000.sql
```

**Automated Backup (Cron):**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * mysqldump -u root -p'your_password' clb_vo_co_truyen_hutech > /backups/db_$(date +\%Y\%m\%d).sql
```

### 2. File Backup

```bash
# Backup uploads folder
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restore uploads
tar -xzf uploads_backup_20240101.tar.gz
```

### 3. Full System Backup

```bash
# Backup entire application
tar -czf clb_vo_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='logs' \
  /path/to/backend/
```

---

## 🔒 Security Checklist

- [ ] Đổi JWT_SECRET thành giá trị ngẫu nhiên mạnh
- [ ] Sử dụng HTTPS (SSL certificate)
- [ ] Cấu hình firewall (chỉ mở port cần thiết)
- [ ] Đổi password MySQL mặc định
- [ ] Giới hạn rate limiting phù hợp
- [ ] Cập nhật dependencies thường xuyên
- [ ] Backup database định kỳ
- [ ] Monitor logs và errors
- [ ] Sử dụng environment variables cho sensitive data
- [ ] Disable debug mode trong production

---

## 🚨 Troubleshooting

### Application không start

```bash
# Check logs
pm2 logs
# hoặc
docker logs clb-vo-api

# Check port
netstat -tulpn | grep :3000

# Check environment variables
pm2 env 0
```

### Database connection failed

```bash
# Check MySQL status
sudo systemctl status mysql

# Test connection
mysql -u your_user -p -h localhost

# Check database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### High memory usage

```bash
# Restart PM2
pm2 restart all

# Clear cache
pm2 flush

# Check memory
pm2 monit
```

---

## 📞 Support

- **Email**: dev@vocotruyenhutech.edu.vn
- **Documentation**: http://your-domain.com/api-docs
- **GitHub Issues**: https://github.com/your-repo/issues

---

**Cập nhật lần cuối**: January 2026
**Version**: 1.0.0
