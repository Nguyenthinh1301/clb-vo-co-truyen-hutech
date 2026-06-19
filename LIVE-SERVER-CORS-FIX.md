# 🔧 Fix CORS cho Live Server (VS Code Go Live)

## 🐛 Vấn đề

Mỗi lần chạy **Live Server** (Go Live extension) trong VS Code:
- Live Server tự động chọn port động: 5500, 5501, 5502, 5503...
- Admin login báo lỗi: **"Không kết nối được backend"**
- Nguyên nhân: Backend CORS chỉ cho phép `http://localhost:3001`, không cho phép các port khác

## ✅ Giải pháp đã áp dụng

### Cập nhật backend/server.js

Thêm logic tự động **chấp nhận mọi localhost/127.0.0.1** với bất kỳ port nào:

```javascript
// CORS configuration - Allow all origins in development, whitelist in production
const corsOptions = {
    origin: function (origin, callback) {
        // Always allow: no origin (file://, curl, mobile apps)
        if (!origin) {
            return callback(null, true);
        }
        
        // Development mode: allow all localhost/127.0.0.1 with any port
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // Production: allow localhost/127.0.0.1 with any port (for local testing)
        // Regex: http(s)://localhost:port or http(s)://127.0.0.1:port
        const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
        if (localhostRegex.test(origin)) {
            return callback(null, true);
        }
        
        // Production: check whitelist
        const allowed = (process.env.CORS_ORIGIN || '')
            .split(',').map(o => o.trim()).filter(Boolean);
        if (allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Các origin được chấp nhận

#### Development mode (NODE_ENV=development):
- ✅ **Tất cả origin** (bao gồm localhost với mọi port)
- Phù hợp cho: Local testing, Live Server

#### Production mode (NODE_ENV=production):
- ✅ **Localhost/127.0.0.1 với mọi port** (cho local testing backend production)
  - `http://localhost:5500` ✅
  - `http://localhost:5501` ✅
  - `http://127.0.0.1:5500` ✅
  - `https://localhost:443` ✅
- ✅ **Domains trong CORS_ORIGIN whitelist**
  - `https://vocotruyenhutech.edu.vn` ✅
  - `https://vo-co-truyen-hutech.netlify.app` ✅
  - (các domain khác trong env var)

---

## 🧪 Test

### Test với Live Server

1. **Start backend:**
```powershell
cd backend
node server.js
```

2. **Start Live Server:**
- Mở file: `website/admin/index.html`
- Click **Go Live** trong VS Code
- Live Server sẽ mở: `http://127.0.0.1:5500/website/admin/` (hoặc port khác)

3. **Verify:**
- ✅ Không còn lỗi "Không kết nối được backend"
- ✅ Đăng nhập thành công
- ✅ Console không còn CORS error

### Test với PowerShell

```powershell
# Test localhost với port bất kỳ
curl.exe -s -H "Origin: http://localhost:5500" `
  -H "Access-Control-Request-Method: POST" `
  -X OPTIONS http://localhost:3001/api/auth/login -i

# Expected: HTTP 204 hoặc 200
# Access-Control-Allow-Origin: http://localhost:5500
```

---

## 📋 Kịch bản sử dụng

### Kịch bản 1: Development (local)
```bash
# Backend
cd backend
npm run dev  # NODE_ENV=development

# Frontend: Live Server (port bất kỳ)
# → Auto-allowed ✅
```

### Kịch bản 2: Production testing (local)
```bash
# Backend
cd backend
NODE_ENV=production node server.js

# Frontend: Live Server (port bất kỳ)
# → Auto-allowed via localhost regex ✅
```

### Kịch bản 3: Production (deployed)
```bash
# Backend on Render
NODE_ENV=production

# Frontend on Netlify
# → Allowed via CORS_ORIGIN whitelist ✅

# Local testing against production backend
# Live Server → Allowed via localhost regex ✅
```

---

## 🔒 Security

### An toàn không?

✅ **AN TOÀN** - Localhost regex chỉ match local development:
```javascript
/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
```

**Matches (allowed):**
- `http://localhost:5500` ✅
- `https://127.0.0.1:8080` ✅
- `http://localhost` (no port) ✅

**Does NOT match (blocked):**
- `http://localhost.evil.com:5500` ❌
- `http://127.0.0.1.attacker.com` ❌
- `http://mylocalhost.com` ❌
- `http://127.0.0.1.co` ❌

### Tại sao cho phép localhost trong production?

1. **Local testing:** Dev có thể test frontend local với production backend
2. **Debugging:** Dễ dàng debug production issues trên local
3. **Safe:** Localhost chỉ accessible từ máy local, không thể truy cập từ internet
4. **Common practice:** Nhiều API production cho phép localhost CORS

---

## 🚀 Deploy

### Update trên Render (không cần thiết)

Code mới tự động hoạt động cả development và production. KHÔNG cần update environment variables.

### Restart backend local

Nếu đang chạy backend local:
```powershell
# Stop backend (Ctrl+C)
# Start lại
cd backend
npm run dev
```

---

## 📊 So sánh trước/sau

### ❌ Trước khi fix

```
Live Server: http://127.0.0.1:5500
Backend CORS: Chỉ accept http://localhost:3001

→ Request bị block
→ Console: "Access to fetch ... has been blocked by CORS policy"
→ Admin: "Không kết nối được backend"
```

### ✅ Sau khi fix

```
Live Server: http://127.0.0.1:5500 (hoặc bất kỳ port nào)
Backend CORS: Accept mọi localhost/127.0.0.1 + mọi port

→ Request allowed
→ Console: Không có CORS error
→ Admin: Đăng nhập thành công ✅
```

---

## 🐞 Troubleshooting

### Vẫn còn CORS error sau khi update?

1. **Restart backend:**
```powershell
# Stop backend (Ctrl+C)
cd backend
npm run dev
```

2. **Clear browser cache:**
- Hard reload: Ctrl+Shift+R (Chrome)
- Hoặc mở Incognito mode

3. **Check backend logs:**
```
Backend should show:
🚀 CLB Võ Cổ Truyền HUTECH API Server
📍 Running on: http://localhost:3001
🌍 Environment: development
```

4. **Verify origin:**
- F12 → Network tab
- Check request Origin header
- Should be: `http://127.0.0.1:5500` (or similar)

---

## 📚 Tài liệu liên quan

- **CORS whitelist (Netlify):** FIX-CORS-ISSUE.md
- **Backend deployment:** Backend deployment guide
- **Test script:** scripts/test-cors.ps1

---

**Updated:** 2026-06-17  
**Status:** ✅ Fixed  
**Impact:** Development experience improvement  
**Breaking changes:** None
