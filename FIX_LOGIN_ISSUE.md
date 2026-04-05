# Hướng Dẫn Sửa Lỗi Đăng Nhập Backend

## Vấn Đề Đã Phát Hiện

Backend đang chạy tốt nhưng đăng nhập thất bại vì:
1. ✅ Backend server đang chạy (http://localhost:3000)
2. ❌ Database chưa có user demo để test
3. ✅ Đã sửa lỗi tên cột `password_hash` → `password` trong code

## Giải Pháp

### Bước 1: Tạo User Demo trong Database

Có 2 cách để tạo user demo:

#### Cách 1: Chạy SQL Script (Khuyến nghị - Nhanh nhất)

1. Mở **SQL Server Management Studio (SSMS)**
2. Kết nối đến `localhost\SQLEXPRESS`
3. Mở file `backend/scripts/insert-demo-users.sql`
4. Chạy script (F5)

Script sẽ tạo 3 user:
- **Admin**: admin@hutech.edu.vn / admin123
- **Member**: member@hutech.edu.vn / member123  
- **Demo**: demo@test.com / 123456

#### Cách 2: Chạy Node.js Script

```bash
cd backend
node scripts/seed-demo-users.js
```

### Bước 2: Khởi Động Lại Backend

```bash
cd backend
npm start
```

Hoặc nếu đang chạy, nhấn Ctrl+C và chạy lại.

### Bước 3: Test Đăng Nhập

1. Mở trình duyệt: http://localhost:5500/website/views/account/dang-nhap.html
2. Đăng nhập với một trong các tài khoản:
   - admin@hutech.edu.vn / admin123
   - member@hutech.edu.vn / member123
   - demo@test.com / 123456

## Các Thay Đổi Đã Thực Hiện

### 1. Sửa Tên Cột Database

Đã sửa tất cả các file backend từ `password_hash` → `password` để khớp với schema MSSQL:

- ✅ `backend/routes/auth.js` - Route đăng nhập/đăng ký
- ✅ `backend/routes/users.js` - Route quản lý user
- ✅ `backend/scripts/seed-demo-users.js` - Script tạo user demo

### 2. Tạo Scripts Hỗ Trợ

- ✅ `backend/scripts/seed-demo-users.js` - Script Node.js tạo user
- ✅ `backend/scripts/quick-create-users.js` - Generate SQL với password hash
- ✅ `backend/scripts/insert-demo-users.sql` - SQL script sẵn sàng chạy

## Kiểm Tra Backend Đang Chạy

```bash
# Kiểm tra health endpoint
curl http://localhost:3000/health

# Hoặc mở trình duyệt
http://localhost:3000/health
```

Nếu thấy response JSON với `"success": true` → Backend đang chạy tốt.

## Troubleshooting

### Lỗi: "Email hoặc mật khẩu không chính xác"

**Nguyên nhân**: Database chưa có user demo

**Giải pháp**: Chạy SQL script ở Bước 1

### Lỗi: "Cannot connect to database"

**Nguyên nhân**: SQL Server chưa chạy hoặc cấu hình sai

**Giải pháp**:
1. Kiểm tra SQL Server đang chạy
2. Kiểm tra file `.env`:
   ```
   DB_TYPE=mssql
   MSSQL_SERVER=localhost\SQLEXPRESS
   MSSQL_DATABASE=clb_vo_co_truyen_hutech
   ```

### Lỗi: "Backend không chạy"

**Giải pháp**:
```bash
cd backend
npm install
npm start
```

## Xác Nhận Hoàn Tất

Sau khi làm theo hướng dẫn, bạn có thể:
- ✅ Đăng nhập thành công với tài khoản demo
- ✅ Chuyển hướng đến dashboard tương ứng (admin/user)
- ✅ Xem thông tin user trong database

## Liên Hệ Hỗ Trợ

Nếu vẫn gặp vấn đề, kiểm tra:
1. Backend logs trong terminal
2. Browser console (F12)
3. Network tab để xem API response
