# 🚀 Hướng dẫn Start Backend

## ⚠️ VẤN ĐỀ: "Không kết nối được backend"

Khi thấy lỗi này trên admin login, **99% là backend chưa chạy**.

---

## ✅ Giải pháp: Start Backend

### Option 1: Dùng PowerShell Script (Khuyến nghị)

```powershell
# Mở PowerShell/Terminal trong VS Code
# Chạy lệnh:
.\start-backend-local.ps1
```

### Option 2: Manual Start

```powershell
# Bước 1: Vào thư mục backend
cd backend

# Bước 2: Start backend
npm run dev
```

### Option 3: Dùng VS Code Terminal

1. Mở **Terminal** trong VS Code: `Ctrl + `
2. Chạy:
   ```powershell
   cd backend
   npm run dev
   ```

---

## 🎯 Kết quả mong đợi

Sau khi start, terminal sẽ hiển thị:

```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
📊 Health check: http://localhost:3001/health
📚 API Docs: http://localhost:3001/api-docs
🔌 WebSocket: Enabled
📡 API Version: v1

✅ Database connected
```

**LƯU Ý:** Để backend chạy trong terminal, **KHÔNG TẮT terminal này**.

---

## 🧪 Verify Backend đã chạy

### Test 1: Health Check (Browser)

Mở browser và vào: http://localhost:3001/health

Kết quả phải là:
```json
{
  "success": true,
  "message": "Server is running",
  "database": {
    "success": true,
    "message": "Database connected"
  }
}
```

### Test 2: PowerShell Command

```powershell
curl http://localhost:3001/health
```

Kết quả phải trả về JSON (không có lỗi "Unable to connect").

### Test 3: Check Port

```powershell
netstat -ano | findstr :3001
```

Phải thấy process đang listen trên port 3001:
```
TCP    0.0.0.0:3001       0.0.0.0:0     LISTENING       12345
```

---

## 🔄 Workflow đầy đủ

### Bước 1: Start Backend
```powershell
# Terminal 1 (để backend chạy)
cd backend
npm run dev
```

### Bước 2: Start Frontend (Live Server)
- Mở file: `website/admin/index.html`
- Click **"Go Live"** trong VS Code
- Browser tự động mở

### Bước 3: Test Login
- URL: `http://127.0.0.1:5500/website/admin/`
- Nhập email + password
- ✅ Đăng nhập thành công

---

## 🐞 Troubleshooting

### Lỗi: "Port 3001 is already in use"

**Nguyên nhân:** Port bị process khác chiếm.

**Giải pháp:**

```powershell
# Bước 1: Tìm process đang chiếm port
netstat -ano | findstr :3001

# Kết quả: 
# TCP  0.0.0.0:3001  ...  LISTENING  12345
#                                    ^^^^^ PID

# Bước 2: Kill process đó
taskkill /PID 12345 /F

# Bước 3: Start lại backend
cd backend
npm run dev
```

### Lỗi: "Database connection failed"

**Nguyên nhân:** Database không chạy hoặc config sai.

**Giải pháp:**

1. **Check database type:**
   ```powershell
   # Xem file backend/.env
   cat backend/.env | findstr DB_TYPE
   ```

2. **PostgreSQL (Neon - default):**
   ```
   DB_TYPE=postgres
   DATABASE_URL=postgresql://...  ← Phải có URL
   ```
   - Neon cloud database → Không cần start local
   - Check connection string đúng chưa

3. **MSSQL (VPS):**
   ```
   DB_TYPE=mssql
   MSSQL_SERVER=localhost\\SQLEXPRESS
   ```
   - Cần SQL Server chạy trên máy local
   - Start SQL Server service

### Lỗi: "npm: command not found"

**Nguyên nhân:** Node.js chưa cài.

**Giải pháp:**

1. Download Node.js: https://nodejs.org/
2. Install (version LTS)
3. Restart terminal
4. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Lỗi: "Module not found"

**Nguyên nhân:** Dependencies chưa install.

**Giải pháp:**

```powershell
cd backend
npm install
npm run dev
```

---

## 📋 Quick Reference

| Vấn đề | Command |
|--------|---------|
| Start backend | `cd backend && npm run dev` |
| Stop backend | `Ctrl + C` trong terminal backend |
| Check backend running | `curl http://localhost:3001/health` |
| Check port | `netstat -ano \| findstr :3001` |
| Kill port 3001 | `Get-NetTCPConnection -LocalPort 3001 \| Select OwningProcess` |

---

## 💡 Tips

### 1. Keep Terminal Open
Backend cần chạy liên tục. **KHÔNG TẮT** terminal đang chạy backend.

### 2. Auto-restart on code change
Backend dùng `nodemon` → tự động restart khi sửa code backend.

### 3. Multiple Terminals
VS Code hỗ trợ nhiều terminal:
- Terminal 1: Backend (`npm run dev`)
- Terminal 2: Commands (git, test...)

### 4. Check Logs
Nếu có lỗi, check logs trong terminal backend để debug.

---

## 🎯 Checklist

Trước khi test admin login, đảm bảo:

- [ ] Backend đang chạy (terminal hiển thị "Server is running")
- [ ] Health check OK: http://localhost:3001/health
- [ ] Database connected (check terminal logs)
- [ ] Frontend đang chạy (Live Server started)
- [ ] Browser đã mở đúng URL admin page

**Sau khi hoàn thành checklist → Admin login sẽ hoạt động!** ✅

---

## 📚 Tài liệu liên quan

- **Quick Start:** QUICK-START-LOCAL-DEV.md
- **CORS Fix:** LIVE-SERVER-CORS-FIX.md
- **Security:** ADMIN-LOGIN-SECURITY-IMPROVEMENTS.md

---

**Tạo:** 2026-06-17  
**Mục đích:** Hướng dẫn start backend cho người dùng non-technical  
**Priority:** 🔴 CAO - Bắt buộc để admin login hoạt động
