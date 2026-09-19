# 🚨 HƯỚNG DẪN SỬA LỖI ADMIN KHÔNG KẾT NỐI ĐƯỢC BACKEND

## Triệu chứng
Khi vào trang admin: https://vo-co-truyen-hutech.netlify.app/admin/

Hiển thị lỗi:
```
❌ Không kết nối được backend. Hãy chắc backend đang chạy.
```

---

## Nguyên nhân
Backend đang chạy bình thường nhưng **chặn requests từ Netlify** do thiếu cấu hình CORS.

---

## Cách sửa (2 phút)

### Bước 1: Đăng nhập Render
1. Vào: https://dashboard.render.com
2. Đăng nhập tài khoản

### Bước 2: Mở project backend
1. Tìm project: `clb-vo-co-truyen-hutech`
2. Click vào để mở

### Bước 3: Sửa Environment Variables
1. Click tab **Environment** (bên trái)
2. Tìm biến: `CORS_ORIGIN`
3. Click nút **Edit** (bút chì) bên phải
4. **SỬA** giá trị thành:

```
https://vocotruyenhutech.edu.vn,https://www.vocotruyenhutech.edu.vn,https://api.vocotruyenhutech.edu.vn,https://vo-co-truyen-hutech.netlify.app
```

**Lưu ý quan trọng:**
- ✅ Copy toàn bộ dòng trên (bao gồm cả phần cũ + phần mới)
- ✅ Không có khoảng trắng giữa các domain
- ✅ Các domain cách nhau bởi dấu phẩy `,`

5. Click nút **Save Changes**

### Bước 4: Chờ backend khởi động lại
- Render sẽ tự động restart
- Màn hình sẽ hiển thị trạng thái "Deploying..."
- Đợi ~30-60 giây cho đến khi thấy "Live" ✅

### Bước 5: Test lại
1. Mở trình duyệt **chế độ ẩn danh** (Ctrl+Shift+N)
2. Vào: https://vo-co-truyen-hutech.netlify.app/admin/
3. Nhập:
   - Email: `admin@vocotruyenhutech.edu.vn`
   - Password: `Admin@2026`
4. Click **Đăng nhập**

**Kết quả mong đợi:**
- ✅ Không còn báo lỗi "Không kết nối được backend"
- ✅ Đăng nhập thành công
- ✅ Chuyển sang trang Dashboard

---

## Nếu vẫn còn lỗi

### Kiểm tra backend có đang chạy không
Mở link này: https://clb-vo-co-truyen-hutech.onrender.com/health

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

Nếu **không mở được** → Backend đang down, cần restart trên Render.

### Kiểm tra CORS đã fix chưa
Chạy script test (từ máy local):
```powershell
cd D:\Code\ThongTin-VCT
.\scripts\test-cors.ps1
```

Kết quả phải là:
```
✅ VERDICT: CORS IS CONFIGURED CORRECTLY
```

Nếu vẫn báo lỗi → Kiểm tra lại Bước 3, đảm bảo đã thêm đúng domain.

---

## Giải thích kỹ thuật (cho developer)

### CORS là gì?
**CORS** (Cross-Origin Resource Sharing) là cơ chế bảo mật của trình duyệt:
- Frontend chạy trên domain: `vo-co-truyen-hutech.netlify.app`
- Backend chạy trên domain: `clb-vo-co-truyen-hutech.onrender.com`
- Đây là 2 domain khác nhau → Browser block request (bảo mật)
- Để cho phép, backend phải khai báo frontend domain trong whitelist

### Tại sao trước đây không lỗi?
- Trước đây test trên localhost → CORS tự động allow trong development mode
- Giờ deploy lên internet → CORS bật chế độ production, chặt chẽ hơn

### Log lỗi trên browser (F12 → Console)
```
Access to fetch at 'https://clb-vo-co-truyen-hutech.onrender.com/api/auth/login'
from origin 'https://vo-co-truyen-hutech.netlify.app' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check
```

---

## Tài liệu tham khảo

- **Chi tiết kỹ thuật:** `FIX-CORS-ISSUE.md`
- **Tóm tắt ngắn:** `CORS-FIX-SUMMARY.md`
- **Test script:** `scripts/test-cors.ps1`

---

## Liên hệ hỗ trợ
Nếu làm theo hướng dẫn mà vẫn không được:
1. Chụp screenshot lỗi (F12 → Console tab)
2. Check backend health: https://clb-vo-co-truyen-hutech.onrender.com/health
3. Chạy test script và gửi kết quả

---

**Cập nhật:** 2026-06-17  
**Version:** 1.0  
**Độ ưu tiên:** 🔴 CAO (blocking admin access)
