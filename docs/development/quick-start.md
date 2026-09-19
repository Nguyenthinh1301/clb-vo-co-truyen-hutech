# 🚀 Hướng dẫn chạy dự án Local (Quick Start)

## ✅ Đã fix: Không còn lỗi CORS khi dùng Live Server!

Giờ bạn có thể chạy **Live Server** với **bất kỳ port nào** (5500, 5501, 5502...) mà không cần lo về CORS.

---

## 📋 Bước chạy nhanh

### 1️⃣ Start Backend

**Option A: PowerShell script (recommended)**
```powershell
.\start-backend-local.ps1
```

**Option B: Manual**
```powershell
cd backend
npm run dev
```

Chờ thấy message:
```
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
✅ Database connected
```

### 2️⃣ Start Frontend (Live Server)

1. Mở file bất kỳ trong `website/` hoặc `website/admin/`
2. Click nút **"Go Live"** ở góc dưới bên phải VS Code
3. Live Server sẽ tự động mở browser với URL kiểu:
   - `http://127.0.0.1:5500/website/admin/index.html`
   - `http://localhost:5501/website/index.html`
   - (Port có thể thay đổi: 5500, 5501, 5502...)

### 3️⃣ Test Admin Login

1. Vào trang admin: `http://127.0.0.1:5500/website/admin/` (hoặc port của bạn)
2. Đăng nhập:
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: `Admin@2026`
3. ✅ Không còn lỗi "Không kết nối được backend"!

---

## 🧪 Test CORS với nhiều port

Chạy script test tự động:
```powershell
.\scripts\test-localhost-cors.ps1
```

Kết quả mong đợi:
```
[1/5] Testing: http://localhost:5500
  ✅ ALLOWED (HTTP 204)

[2/5] Testing: http://localhost:5501
  ✅ ALLOWED (HTTP 204)

[3/5] Testing: http://localhost:5502
  ✅ ALLOWED (HTTP 204)

[4/5] Testing: http://localhost:8080
  ✅ ALLOWED (HTTP 204)

[5/5] Testing: http://localhost:3000
  ✅ ALLOWED (HTTP 204)

[BONUS] Testing: http://127.0.0.1:5500
  ✅ ALLOWED (HTTP 204)

✅ VERDICT: ALL TESTS PASSED
```

---

## 🔧 Giải thích kỹ thuật

### Trước đây (có lỗi CORS):
```
Live Server: http://127.0.0.1:5500
Backend CORS: Chỉ accept localhost:3001

❌ Browser blocks request
❌ Console: "blocked by CORS policy"
❌ Admin: "Không kết nối được backend"
```

### Bây giờ (đã fix):
```
Live Server: http://127.0.0.1:5500 (hoặc BẤT KỲ PORT NÀO)
Backend CORS: Accept MỌI localhost/127.0.0.1 + mọi port

✅ Browser allows request
✅ No CORS error
✅ Admin login thành công
```

### Code thay đổi (backend/server.js):

```javascript
// Production: allow localhost/127.0.0.1 with any port (for local testing)
const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
if (localhostRegex.test(origin)) {
    return callback(null, true);  // ✅ Auto-allow localhost
}
```

Regex này chỉ match **đúng localhost**, không match domain giả mạo:
- ✅ `http://localhost:5500` → ALLOWED
- ✅ `http://127.0.0.1:8080` → ALLOWED
- ❌ `http://localhost.evil.com` → BLOCKED
- ❌ `http://127.0.0.1.attacker.com` → BLOCKED

---

## 🛠️ Troubleshooting

### Vẫn còn lỗi CORS?

1. **Restart backend:**
```powershell
# Stop backend (Ctrl+C in terminal)
.\start-backend-local.ps1
```

2. **Clear browser cache:**
- Hard reload: `Ctrl + Shift + R`
- Hoặc mở **Incognito mode**

3. **Check backend đang chạy:**
```powershell
curl http://localhost:3001/health
```
Phải trả về:
```json
{
  "success": true,
  "message": "Server is running"
}
```

4. **Check Live Server port:**
- Xem status bar VS Code (góc dưới)
- Hoặc F12 → Console → Check error messages

### Backend không start?

```powershell
# Check port 3001 có bị chiếm không
netstat -ano | findstr :3001

# Nếu có process khác chiếm port
# Kill process đó hoặc đổi PORT trong .env
```

---

## 📚 Tài liệu chi tiết

- **LIVE-SERVER-CORS-FIX.md** - Chi tiết kỹ thuật về fix CORS
- **LOCAL-DEVELOPMENT-GUIDE.md** - Hướng dẫn development đầy đủ
- **FIX-CORS-ISSUE.md** - Fix CORS cho production (Netlify)

---

## 🎯 Workflow khuyến nghị

### Development workflow:
1. Mở VS Code tại thư mục project
2. Terminal 1: `.\start-backend-local.ps1` (hoặc `cd backend; npm run dev`)
3. Click **Go Live** để start frontend
4. Code → Save → Browser auto-reload (Live Server)
5. Backend auto-restart khi code thay đổi (nodemon)

### Admin panel workflow:
1. Backend running: `http://localhost:3001`
2. Live Server running: `http://127.0.0.1:5500` (hoặc port khác)
3. Mở admin: `http://127.0.0.1:5500/website/admin/`
4. Login → Quản lý content → Logout

### Production testing workflow:
1. Backend local: Development mode
2. Frontend: Netlify (production URL)
3. Test integration end-to-end
4. Deploy backend to Render khi OK

---

## ✅ Checklist

- [x] Backend CORS đã fix (accept all localhost ports)
- [x] Test script đã tạo (`test-localhost-cors.ps1`)
- [x] Documentation đầy đủ
- [x] Commit & push lên GitHub

**Giờ bạn có thể dev thoải mái với Live Server!** 🎉

---

**Updated:** 2026-06-17  
**Version:** 2.0  
**Breaking changes:** None
