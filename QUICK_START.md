# ⚡ CLB Võ Cổ Truyền HUTECH - Quick Start Guide

Hướng dẫn bắt đầu nhanh để chạy dự án trong 5 phút.

---

## 🚀 CHẠY LOCAL (Development)

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL hoặc MySQL/MSSQL
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/clb-vo-co-truyen-hutech.git
cd clb-vo-co-truyen-hutech
```

### 2. Setup Backend

```powershell
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Copy environment file
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
notepad .env

# Khởi tạo database
npm run init-db

# Chạy backend
npm run dev
```

Backend sẽ chạy tại: **http://localhost:3001**

### 3. Setup Frontend

Mở terminal mới:

```powershell
# Từ thư mục root
cd website

# Mở bằng Live Server hoặc
# Sử dụng Python HTTP Server
python -m http.server 5500
```

Frontend sẽ chạy tại: **http://localhost:5500**

### 4. Truy Cập

- **Website:** http://localhost:5500
- **Admin Panel:** http://localhost:5500/admin/
- **API Docs:** http://localhost:3001/api-docs
- **Health Check:** http://localhost:3001/health

**Admin Credentials (Local):**
- Email: `admin@vocotruyenhutech.edu.vn`
- Password: `<mật khẩu admin>`

---

## 🌍 PRODUCTION

### Live URLs
- **Website:** https://vocotruyenhutech.netlify.app
- **Backend API:** https://clb-vo-co-truyen-hutech.onrender.com
- **Admin:** https://vocotruyenhutech.netlify.app/admin/

### Deployment
```powershell
# Deploy được tự động khi push lên GitHub main branch
git add .
git commit -m "your message"
git push origin main

# Netlify auto-deploys frontend (1 phút)
# Render auto-deploys backend (2-3 phút)
```

---

## 📚 DOCUMENTATION

Xem thêm tài liệu chi tiết trong thư mục [`docs/`](docs/):

- **[Deployment Guide](docs/deployment/README.md)** - Hướng dẫn deploy đầy đủ
- **[Development Guide](docs/development/local-setup.md)** - Setup môi trường dev
- **[Admin Guide](docs/admin/login-guide.md)** - Quản trị hệ thống
- **[API Documentation](http://localhost:3001/api-docs)** - API reference

---

## 🧪 TESTING

```powershell
# Backend tests
cd backend
npm test

# Production verification
.\scripts\verify-production.ps1

# Contact form test
.\scripts\test-contact-flow-quick.ps1
```

---

## 🆘 TROUBLESHOOTING

### Backend không kết nối được database
```powershell
# Kiểm tra .env file
cat backend\.env

# Test database connection
cd backend
node scripts\test-connection.js
```

### Frontend không load được API
- Kiểm tra `website/assets/js/config.js`
- Đảm bảo `API_BASE_URL` đúng
- Check CORS trong backend

### Admin không đăng nhập được
- Xem [docs/admin/troubleshooting-vi.md](docs/admin/troubleshooting-vi.md)
- Reset admin password: `npm run reset-admin`

**Chi tiết:** [docs/fixes/](docs/fixes/)

---

## 📞 SUPPORT

- **Documentation:** [docs/README.md](docs/README.md)
- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Email:** vctht2026@gmail.com

---

**Cập nhật:** 19/09/2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
