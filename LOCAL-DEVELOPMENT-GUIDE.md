# 🚀 Hướng dẫn chạy Local Development

## ❌ Vấn đề: Admin Go Live không kết nối được backend

Khi bạn chạy **Live Server (Go Live)** trên VS Code để test admin panel, lỗi "Không kết nối được backend" xảy ra vì:

```
Admin frontend (Live Server): http://localhost:5500 hoặc http://127.0.0.1:5500
Backend API:                  http://localhost:3001  ← CHƯA CHẠY!
```

→ **Frontend tìm backend nhưng backend không chạy** → Lỗi kết nối

---

## ✅ Giải pháp: Khởi động Backend Local

### Cách 1: Dùng Script tự động (KHUYÊN DÙNG)

**Mở PowerShell tại thư mục dự án:**

```powershell
cd D:\Code\ThongTin-VCT
.\start-backend-local.ps1
```

Script sẽ:
- ✅ Kiểm tra Node.js
- ✅ Kiểm tra dependencies
- ✅ Kiểm tra port 3001
- ✅ Khởi động backend với nodemon (auto-reload)

**Kết quả:**
```
======================================
  BACKEND ĐANG KHỞI ĐỘNG...
======================================

  API URL:      http://localhost:3001/api
  Health check: http://localhost:3001/health
  Environment:  development

  Để DỪNG backend: Ctrl+C
======================================

🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
...
```

---

### Cách 2: Chạy thủ công

**Bước 1: Mở terminal tại thư mục backend**

```powershell
cd D:\Code\ThongTin-VCT\backend
```

**Bước 2: Cài dependencies (nếu chưa cài)**

```powershell
npm install
```

**Bước 3: Khởi động backend**

```powershell
npm run dev
```

**Kết quả mong đợi:**
```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
📊 Health check: http://localhost:3001/health
```

---

## 🧪 Kiểm tra Backend đã chạy chưa

### Test 1: Mở trình duyệt
```
http://localhost:3001/health
```

**Kết quả đúng:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-06-17T...",
  "environment": "development",
  "database": {
    "success": true,
    "message": "Database connected"
  }
}
```

### Test 2: PowerShell
```powershell
curl.exe http://localhost:3001/health
```

### Test 3: Check port
```powershell
Test-NetConnection -ComputerName localhost -Port 3001
```

**Kết quả đúng:** `TcpTestSucceeded: True`

---

## 🎯 Workflow đầy đủ: Local Development

### Terminal 1: Backend (để chạy suốt)
```powershell
cd D:\Code\ThongTin-VCT
.\start-backend-local.ps1

# Hoặc:
cd D:\Code\ThongTin-VCT\backend
npm run dev
```

**→ ĐỂ CHẠY, KHÔNG TẮT!** Backend sẽ auto-reload khi bạn sửa code.

---

### VS Code: Frontend (Go Live)
1. Mở file: `website/admin/index.html`
2. Click chuột phải → **Open with Live Server** (hoặc Alt+L Alt+O)
3. Browser tự động mở: `http://localhost:5500/website/admin/index.html`
4. Login với:
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: `Admin@2026`
5. ✅ Thành công → Redirect về Dashboard

---

## 📋 Checklist hoàn chỉnh

```
□ Node.js đã cài đặt (node --version)
□ Backend dependencies đã cài (npm install)
□ Backend đang chạy (port 3001)
□ Health check OK (http://localhost:3001/health)
□ Live Server đang chạy (port 5500)
□ Admin login thành công
```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module"
```powershell
cd backend
npm install
```

### Lỗi: "Port 3001 already in use"
```powershell
# Tìm process đang dùng port 3001
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess

# Kill process (thay <PID> bằng số PID tìm được)
Stop-Process -Id <PID> -Force
```

### Lỗi: "Database connection failed"
Kiểm tra file `.env` trong thư mục `backend`:

```bash
# backend/.env
NODE_ENV=development
PORT=3001

# Database - chọn 1 trong 2:
DB_TYPE=postgres
DATABASE_URL=postgresql://...  # Nếu dùng PostgreSQL

# Hoặc
DB_TYPE=mssql
MSSQL_SERVER=localhost\\SQLEXPRESS
MSSQL_DATABASE=clb_vo_co_truyen_hutech
MSSQL_USER=...
MSSQL_PASSWORD=...
```

### Lỗi: Live Server mở sai URL
Phải mở file `website/admin/index.html`, KHÔNG phải file khác.

**URL đúng:**
```
http://localhost:5500/website/admin/index.html
```

**URL SAI:**
```
http://localhost:5500/admin/index.html  ← Thiếu /website
```

---

## 🔄 Tắt Backend

**Trong terminal đang chạy backend:**
```
Ctrl + C
```

Hoặc kill process:
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## 💡 Tips

### Auto-reload Backend
Dùng `npm run dev` thay vì `npm start`:
- `npm start` → Chạy với Node.js thuần, phải restart thủ công khi sửa code
- `npm run dev` → Chạy với nodemon, tự động restart khi file thay đổi ✅

### Check Backend logs
Logs sẽ hiện trực tiếp trong terminal đang chạy backend:
```
[2026-06-17 16:30:15] GET /api/auth/login 200 45ms
[2026-06-17 16:30:20] POST /api/auth/login 200 120ms
```

### Debug Frontend
Mở Browser Console (F12) để xem lỗi chi tiết:
```javascript
// Nếu backend chưa chạy:
Failed to fetch: net::ERR_CONNECTION_REFUSED

// Nếu CORS lỗi (không phải local):
Access to fetch has been blocked by CORS policy

// Nếu OK:
POST http://localhost:3001/api/auth/login 200 OK
```

---

## 📚 Tài liệu liên quan

- **Backend API Docs:** http://localhost:3001/api-docs (khi backend đang chạy)
- **Health Check:** http://localhost:3001/health
- **Database Schema:** `backend/database/pg-schema.sql`

---

## 🎓 Hiểu rõ hơn về Development vs Production

| Environment | Frontend | Backend | CORS |
|-------------|----------|---------|------|
| **Local Dev (Live Server)** | `localhost:5500` | `localhost:3001` | ✅ Auto-allow |
| **Production (Netlify)** | `vo-co-truyen-hutech.netlify.app` | `clb-vo-co-truyen-hutech.onrender.com` | ⚠️ Cần config |

**→ Local development:** Backend tự động allow localhost → Không cần config CORS  
**→ Production deployment:** Cần thêm Netlify domain vào CORS_ORIGIN (như đã hướng dẫn trước)

---

**Tạo ngày:** 2026-06-17  
**Version:** 1.0  
**Cho:** Local Development với Live Server
