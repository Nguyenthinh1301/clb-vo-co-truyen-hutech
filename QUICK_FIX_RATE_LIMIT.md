# ⚡ Quick Fix - Rate Limit Error

## 🚨 Lỗi: "Quá nhiều yêu cầu từ IP này"

## ✅ Giải Pháp Nhanh (3 Bước)

### Bước 1: Mở PowerShell trong thư mục backend

```powershell
cd backend
```

### Bước 2: Chạy script restart

```powershell
.\restart-backend.ps1
```

Hoặc nếu không chạy được script, làm thủ công:

```powershell
# Dừng backend
Get-Process -Name node | Stop-Process -Force

# Khởi động lại
npm start
```

### Bước 3: Thử đăng nhập lại

- URL: http://localhost:3000/website/views/account/dang-nhap.html
- Email: `user@hutech.edu.vn`
- Password: `user123`

## 🎯 Xong!

Rate limit đã được tăng lên 1000 requests/15 phút. Bạn có thể đăng nhập bình thường.

---

## 📖 Chi Tiết

Xem file `FIX_RATE_LIMIT.md` để biết thêm chi tiết về:
- Nguyên nhân lỗi
- Cách hoạt động của rate limit
- Các cách khắc phục khác
- Tips tránh bị rate limit
