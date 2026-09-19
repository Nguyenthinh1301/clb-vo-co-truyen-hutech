# 🔧 Fix lỗi "Không kết nối được backend" - Hướng dẫn đầy đủ

## 🎯 Vấn đề

Khi mở admin login page bằng Live Server (Go Live), thấy lỗi:
```
❌ Không kết nối được backend. Hãy chắc backend đang chạy.
```

---

## ✅ Giải pháp (3 bước)

### Bước 1: Kiểm tra backend status

**Mở tool kiểm tra backend:**

Double-click file: `check-backend.html` trong VS Code

Hoặc mở bằng Live Server: Right-click `check-backend.html` → Open with Live Server

**Kết quả:**
- ✅ **Backend ONLINE** → Chuyển bước 3
- ❌ **Backend OFFLINE** → Tiếp tục bước 2

---

### Bước 2: Start Backend

**Option A: Terminal trong VS Code (Khuyến nghị)**

```powershell
# Bước 1: Mở Terminal (Ctrl + `)
# Bước 2: Chạy lệnh:
cd backend
npm run dev

# Chờ thấy:
# ✅ Server is running
# ✅ Database connected
```

**Option B: Double-click file**

Double-click file: `start-backend.bat`

**Option C: PowerShell Script**

```powershell
.\start-backend-local.ps1
```

**LƯU Ý QUAN TRỌNG:**
- ⚠️ **KHÔNG TẮT** terminal đang chạy backend
- ⚠️ Backend cần chạy **LIÊN TỤC** khi bạn đang dev
- ⚠️ Mỗi lần mở dự án phải start backend lại

---

### Bước 3: Clear Browser Cache & Reload

**Tại sao cần clear cache?**
- Browser đang cache phiên bản cũ của trang
- Email/password hiển thị cũ từ cache
- Lỗi vẫn hiện dù backend đã chạy

**Cách clear cache:**

1. **Hard Reload (Khuyến nghị):**
   - Chrome/Edge: `Ctrl + Shift + R`
   - Firefox: `Ctrl + F5`

2. **Incognito/Private Mode:**
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Mở lại admin login trong incognito

3. **Clear Browser Cache thủ công:**
   - Chrome: `Ctrl + Shift + Delete`
   - Chọn "Cached images and files"
   - Time range: "All time"
   - Click "Clear data"

**Sau khi clear cache:**
- Reload admin page: `F5`
- ✅ Email field: EMPTY
- ✅ Password field: EMPTY
- ✅ Thấy thông báo "Backend đang online ✅"

---

## 🧪 Verify Backend đang chạy

### Test 1: Browser Health Check

Mở tab mới, vào: **http://localhost:3001/health**

**Expected result:**
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

### Test 2: Backend Status Tool

Mở file: `check-backend.html` (Live Server hoặc double-click)

**Expected result:**
```
✅ Backend đang ONLINE!
Backend có thể kết nối thành công.
```

### Test 3: PowerShell Command

```powershell
curl http://localhost:3001/health
```

**Expected result:** JSON response (không có lỗi "Unable to connect")

### Test 4: Check Port

```powershell
netstat -ano | findstr :3001
```

**Expected result:**
```
TCP    0.0.0.0:3001       0.0.0.0:0     LISTENING       12345
```

---

## 🎯 Workflow đúng

```
┌─────────────────────────────────────────┐
│  1. MỞ DỰ ÁN TRONG VS CODE              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  2. START BACKEND (Ctrl+` → cd backend) │
│     npm run dev                         │
│     ✅ Chờ "Server is running"          │
│     ⚠️  KHÔNG TẮT terminal này          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  3. VERIFY: check-backend.html          │
│     ✅ Backend ONLINE → OK              │
│     ❌ Backend OFFLINE → Quay bước 2    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  4. START FRONTEND (Live Server)        │
│     Mở: website/admin/index.html       │
│     Click "Go Live"                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  5. CLEAR CACHE & RELOAD                │
│     Hard Reload: Ctrl+Shift+R           │
│     Hoặc: Incognito mode                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  6. LOGIN                               │
│     ✅ Email field: EMPTY               │
│     ✅ Không còn lỗi backend            │
│     ✅ Đăng nhập thành công! 🎉        │
└─────────────────────────────────────────┘
```

---

## 🐞 Troubleshooting

### Vẫn thấy email pre-filled sau khi clear cache?

**Browser autofill/form restore đang hoạt động.**

**Giải pháp:**
1. Disable browser password manager:
   - Chrome: Settings → Autofill → Passwords → Turn OFF
2. Hoặc dùng Incognito mode (không có cache/autofill)
3. Hoặc clear browsing data (passwords + autofill)

### Backend start nhưng vẫn lỗi "Cannot connect"?

**Kiểm tra CORS:**

1. Xem backend logs trong terminal
2. Nếu thấy CORS error → Backend đã fix, reload lại admin page
3. Check `backend/server.js` có localhost regex:
   ```javascript
   const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
   ```

### Port 3001 bị chiếm bởi process khác?

```powershell
# Tìm process
netstat -ano | findstr :3001

# Kill process (thay PID bằng số thực tế)
taskkill /PID 12345 /F

# Start lại backend
cd backend
npm run dev
```

### Database connection failed?

**Check `.env` file:**

```powershell
# PostgreSQL (Neon - default)
DB_TYPE=postgres
DATABASE_URL=postgresql://...

# MSSQL (VPS)
DB_TYPE=mssql
MSSQL_SERVER=localhost\\SQLEXPRESS
```

**Neon database (cloud):**
- Không cần start local
- Check connection string đúng chưa
- Check internet connection

**MSSQL (local):**
- Cần SQL Server chạy trên máy
- Start SQL Server service

### npm: command not found?

**Node.js chưa cài đặt.**

1. Download: https://nodejs.org/
2. Install (LTS version)
3. Restart terminal/VS Code
4. Verify:
   ```powershell
   node --version
   npm --version
   ```

### Module not found?

**Dependencies chưa install.**

```powershell
cd backend
npm install
npm run dev
```

---

## 📊 Checklist trước khi login

- [ ] Backend đã start (terminal hiển thị "Server is running")
- [ ] Health check OK: http://localhost:3001/health trả về JSON
- [ ] check-backend.html hiển thị "Backend ONLINE ✅"
- [ ] Live Server đã start (port 5500 hoặc khác)
- [ ] Browser cache đã clear (Ctrl+Shift+R hoặc Incognito)
- [ ] Admin page không còn hiển thị email pre-filled
- [ ] Thấy message "Backend đang online ✅" trên admin page

**Khi tất cả ✅ → Admin login sẽ hoạt động!**

---

## 🎓 Hiểu rõ hơn về vấn đề

### Tại sao cần start backend thủ công?

Backend là **server API riêng biệt**, không phải static files như HTML/CSS.

- **Frontend (HTML):** Live Server tự động serve
- **Backend (Node.js API):** Phải start thủ công với `npm run dev`

### Tại sao mỗi lần mở dự án phải start lại?

Backend process chỉ chạy trong terminal session. Khi:
- Tắt terminal → Backend stop
- Tắt VS Code → Backend stop
- Restart máy → Backend stop

→ Phải start lại mỗi lần làm việc.

### Tại sao browser cache gây lỗi?

Browser cache cả HTML/CSS/JS để load nhanh hơn. Khi:
- Code thay đổi (fix email pre-fill, fix CORS)
- Browser vẫn dùng version cũ từ cache
- → Phải clear cache để load version mới

### Live Server hoạt động như thế nào?

Live Server:
1. Start local HTTP server trên port 5500 (hoặc khác)
2. Serve static files (HTML/CSS/JS)
3. Auto-reload khi file thay đổi

Live Server **KHÔNG** start backend → Phải start backend riêng.

---

## 📚 Tools & Files hỗ trợ

| File/Tool | Mục đích | Cách dùng |
|-----------|----------|-----------|
| **check-backend.html** | Kiểm tra backend status | Double-click hoặc Live Server |
| **start-backend.bat** | Start backend dễ dàng | Double-click |
| **start-backend-local.ps1** | PowerShell script | `.\start-backend-local.ps1` |
| **HOW-TO-RUN.md** | Quick start 2 bước | Đọc đầu tiên |
| **START-BACKEND.md** | Chi tiết start backend | Khi gặp vấn đề |
| **QUICK-START-LOCAL-DEV.md** | Workflow đầy đủ | Cho developer |

---

## 📞 Cần giúp đỡ thêm?

1. **Backend không start:** Xem START-BACKEND.md
2. **CORS issues:** Xem LIVE-SERVER-CORS-FIX.md
3. **Security concerns:** Xem ADMIN-LOGIN-SECURITY-IMPROVEMENTS.md
4. **Production deployment:** Xem FIX-CORS-ISSUE.md

---

## 💡 Tips Pro

### Tip 1: Keep Terminal Open
Dùng **Split Terminal** trong VS Code:
- Terminal 1: Backend (`npm run dev`)
- Terminal 2: Git commands, testing...

### Tip 2: Auto-restart Backend
Backend dùng `nodemon` → tự động restart khi code thay đổi.
→ Không cần restart thủ công khi sửa backend code.

### Tip 3: Use Incognito for Testing
Test luôn trong Incognito mode → Không bị cache, tránh lỗi ngớ ngẩn.

### Tip 4: Bookmark Health Check
Bookmark: http://localhost:3001/health
→ Check nhanh backend có chạy không.

### Tip 5: Create Workspace
Save VS Code workspace với cả backend + frontend opened.
→ Mở workspace → Start backend ngay → Tiết kiệm thời gian.

---

**Tạo:** 2026-06-17  
**Cập nhật:** 2026-06-17  
**Version:** 2.0  
**Status:** Comprehensive troubleshooting guide
