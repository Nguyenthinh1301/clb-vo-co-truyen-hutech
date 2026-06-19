# 🚀 Cách chạy dự án (Đơn giản)

## ⚡ Quick Start (2 bước)

### Bước 1: Start Backend
**Double-click file này:**
```
start-backend.bat
```

Hoặc mở PowerShell và chạy:
```powershell
.\start-backend-local.ps1
```

Hoặc manual:
```powershell
cd backend
npm run dev
```

Chờ đến khi thấy:
```
✅ Server is running
✅ Database connected
```

**LƯU Ý:** Giữ cửa sổ này mở (không tắt terminal).

---

### Bước 2: Start Frontend (Live Server)

1. Mở VS Code
2. Mở file: `website/admin/index.html`
3. Click nút **"Go Live"** ở góc dưới bên phải
4. Browser tự động mở trang admin

---

## ✅ Kết quả

- Backend chạy tại: http://localhost:3001
- Frontend chạy tại: http://127.0.0.1:5500/website/admin/ (hoặc port khác)
- Admin login hoạt động bình thường ✅

---

## 🐞 Nếu gặp lỗi "Không kết nối được backend"

### Kiểm tra backend có chạy không:

**Mở browser và vào:**
```
http://localhost:3001/health
```

**Phải thấy:**
```json
{
  "success": true,
  "message": "Server is running"
}
```

**Nếu không mở được** → Backend chưa chạy → Quay lại Bước 1.

---

## 📁 Files quan trọng

| File | Mục đích |
|------|----------|
| **start-backend.bat** | Double-click để start backend (Windows) |
| **start-backend-local.ps1** | Script PowerShell start backend |
| **START-BACKEND.md** | Hướng dẫn chi tiết start backend |
| **QUICK-START-LOCAL-DEV.md** | Hướng dẫn đầy đủ development |

---

## 🎯 Workflow hàng ngày

### Sáng bắt đầu làm việc:
1. Mở VS Code
2. Double-click `start-backend.bat` (hoặc chạy trong terminal)
3. Click "Go Live" trong VS Code
4. Bắt đầu code!

### Tối kết thúc làm việc:
1. `Ctrl + C` trong terminal backend (stop backend)
2. Click "Port: 5500" trong VS Code status bar → Stop Live Server
3. Close VS Code

---

## 💡 Tips

### Backend đang chạy hay chưa?
```powershell
curl http://localhost:3001/health
```
Nếu OK → Backend đang chạy ✅

### Stop backend
`Ctrl + C` trong terminal đang chạy backend

### Check port 3001
```powershell
netstat -ano | findstr :3001
```

### Logs backend
Check terminal đang chạy backend để xem logs real-time

---

## 📞 Cần giúp đỡ?

Xem hướng dẫn chi tiết:
- **START-BACKEND.md** - Hướng dẫn start backend chi tiết
- **QUICK-START-LOCAL-DEV.md** - Workflow development đầy đủ
- **LIVE-SERVER-CORS-FIX.md** - Fix CORS issues

---

**Đơn giản vậy thôi! Happy coding! 🎉**
