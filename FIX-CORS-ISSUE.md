# 🔧 Hướng dẫn sửa lỗi CORS - Admin không kết nối được Backend

## ❌ Vấn đề hiện tại

Admin login page trên Netlify hiện đang báo lỗi:
```
Không kết nối được backend. Hãy chắc backend đang chạy.
```

**Nguyên nhân:** Backend (Render) đang chặn requests từ Netlify do cấu hình CORS chưa đúng.

---

## 🔍 Chi tiết kỹ thuật

### Backend hiện tại
- ✅ **Status**: ONLINE và hoạt động bình thường
- ✅ **Health check**: `https://clb-vo-co-truyen-hutech.onrender.com/health` → OK
- ✅ **Database**: Connected
- ✅ **Uptime**: ~25 phút

### CORS Configuration
Backend hiện tại chỉ cho phép:
```
CORS_ORIGIN=https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://api.vocotruyenhutech.edu.vn
```

Nhưng frontend đang deploy trên:
```
https://vo-co-truyen-hutech.netlify.app  ❌ KHÔNG có trong whitelist
```

Khi browser gửi OPTIONS request (preflight), backend trả về:
```json
{
  "success": false,
  "error": {
    "message": "Not allowed by CORS",
    "code": "INTERNAL_SERVER_ERROR"
  }
}
```

---

## ✅ Giải pháp

### Bước 1: Thêm Netlify domain vào CORS whitelist

Truy cập **Render Dashboard**:
1. Vào project backend: `clb-vo-co-truyen-hutech`
2. Chọn tab **Environment**
3. Tìm biến `CORS_ORIGIN`
4. **SỬA** thành:

```
https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://api.vocotruyenhutech.edu.vn,https://vo-co-truyen-hutech.netlify.app
```

5. Click **Save Changes**
6. Render sẽ tự động restart backend (mất ~30-60 giây)

### Bước 2: Test lại

Sau khi backend restart xong (~1 phút):

1. Mở trình duyệt **Incognito/Private mode** (để tránh cache)
2. Truy cập: https://vo-co-truyen-hutech.netlify.app/admin/
3. Thử đăng nhập với:
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: *(mật khẩu admin)*

Nếu thành công → Redirect về Dashboard ✅

---

## 🧪 Cách test CORS thủ công (cho dev)

### Test OPTIONS request (preflight):
```powershell
curl.exe -s -H "Origin: https://vo-co-truyen-hutech.netlify.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login -i
```

**Kết quả mong đợi sau khi fix:**
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://vo-co-truyen-hutech.netlify.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Kết quả hiện tại (TRƯỚC khi fix):**
```
HTTP/1.1 500 Internal Server Error
{"success":false,"error":{"message":"Not allowed by CORS"}}
```

### Test POST request thực tế:
```powershell
curl.exe -s -X POST https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login `
  -H "Origin: https://vo-co-truyen-hutech.netlify.app" `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@vocotruyenhutech.edu.vn","password":"Admin@2026"}' | ConvertFrom-Json | ConvertTo-Json
```

---

## 📋 Checklist sau khi fix

- [ ] CORS_ORIGIN đã thêm Netlify domain
- [ ] Backend đã restart thành công
- [ ] OPTIONS request trả về 204 (không còn 500)
- [ ] Login page không còn báo "Không kết nối được backend"
- [ ] Đăng nhập thành công → redirect về Dashboard

---

## 🎯 Lưu ý quan trọng

### Domain planning
Nếu sau này có custom domain mới (ví dụ: `https://clb.vocotruyenhutech.edu.vn`), nhớ thêm vào `CORS_ORIGIN`:

```
CORS_ORIGIN=https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://vo-co-truyen-hutech.netlify.app,https://clb.vocotruyenhutech.edu.vn
```

### Development mode
Code đã có logic tự động allow localhost trong development:
```javascript
// backend/server.js (line 27-30)
if (!origin || process.env.NODE_ENV === 'development') {
    return callback(null, true);
}
```
→ Local development KHÔNG cần cấu hình CORS

### Security best practice
- Chỉ thêm domains thật sự cần thiết vào whitelist
- KHÔNG dùng wildcard `*` trong production
- Định kỳ review lại CORS_ORIGIN khi thay đổi domain

---

## 🔗 Links tham khảo

- Backend health check: https://clb-vo-co-truyen-hutech.onrender.com/health
- Frontend (Netlify): https://vo-co-truyen-hutech.netlify.app
- Admin login: https://vo-co-truyen-hutech.netlify.app/admin/
- Render Dashboard: https://dashboard.render.com

---

**Tạo ngày:** 2026-06-17  
**Status:** 🔴 Cần fix ngay (blocking admin access)  
**ETA:** ~2 phút (chỉ cần update 1 biến môi trường)
