# 🗄️ Microsoft SQL Server Setup Guide

## Hướng dẫn thiết lập SQL Server cho CLB Võ Cổ Truyền HUTECH

---

## Bước 1: Mở SQL Server Management Studio (SSMS)

1. Tìm và mở **SQL Server Management Studio** từ Start Menu
2. Nếu chưa cài SSMS, tải tại: https://aka.ms/ssmsfullsetup

---

## Bước 2: Kết nối SQL Server

1. Trong cửa sổ **Connect to Server**:
   - Server type: `Database Engine`
   - Server name: `localhost\SQLEXPRESS` hoặc `(local)\SQLEXPRESS`
   - Authentication: `Windows Authentication`
   - Click **Connect**

---

## Bước 3: Tạo Database

### Cách 1: Sử dụng GUI

1. Trong **Object Explorer**, chuột phải vào **Databases**
2. Chọn **New Database...**
3. Database name: `clb_vo_co_truyen_hutech`
4. Click **OK**

### Cách 2: Sử dụng SQL Script

1. Click **New Query**
2. Copy và paste nội dung file `backend/database/mssql-schema.sql`
3. Click **Execute** (hoặc nhấn F5)
4. Đợi script chạy xong

---

## Bước 4: Tạo Tables và Seed Data

### Sử dụng SQL Script (Khuyến nghị)

1. Mở file `backend/database/mssql-schema.sql` trong SSMS
2. Click **Execute** (F5)
3. Kiểm tra kết quả trong Messages tab

### Hoặc chạy từng phần:

```sql
-- 1. Tạo database
CREATE DATABASE clb_vo_co_truyen_hutech;
GO

USE clb_vo_co_truyen_hutech;
GO

-- 2. Copy và paste phần tạo tables từ mssql-schema.sql
-- (Tất cả các CREATE TABLE statements)

-- 3. Tạo admin user
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    'admin@vocotruyenhutech.edu.vn',
    '$2a$10$YourHashedPasswordHere', -- Sẽ cập nhật sau
    'Administrator',
    '0123456789',
    'admin',
    1
);
```

---

## Bước 5: Cấu hình Backend

1. Mở file `backend/.env`
2. Cập nhật cấu hình:

```env
# Database Type
DB_TYPE=mssql

# SQL Server Configuration
MSSQL_SERVER=localhost\\SQLEXPRESS
MSSQL_DATABASE=clb_vo_co_truyen_hutech
MSSQL_USER=
MSSQL_PASSWORD=
MSSQL_ENCRYPT=false
MSSQL_TRUSTED_CONNECTION=true
```

---

## Bước 6: Test Kết Nối

### Từ SSMS:

```sql
USE clb_vo_co_truyen_hutech;

-- Kiểm tra tables
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE';

-- Kiểm tra users
SELECT * FROM users;
```

### Từ Backend:

```bash
cd backend
node -e "const sql = require('mssql'); sql.connect({server:'localhost\\\\SQLEXPRESS',options:{trustServerCertificate:true,trustedConnection:true}}).then(()=>console.log('✅ Connected')).catch(e=>console.log('❌',e.message))"
```

---

## Bước 7: Tạo Admin User với Password

### Cách 1: Sử dụng Node.js

```bash
cd backend
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('admin123456',10).then(h=>console.log('Password hash:',h))"
```

Copy hash và chạy trong SSMS:

```sql
USE clb_vo_co_truyen_hutech;

-- Xóa user cũ nếu có
DELETE FROM users WHERE email = 'admin@vocotruyenhutech.edu.vn';

-- Tạo admin user mới
INSERT INTO users (email, password, full_name, phone, role, email_verified)
VALUES (
    'admin@vocotruyenhutech.edu.vn',
    'PASTE_HASH_HERE', -- Paste hash từ bước trên
    'Administrator',
    '0123456789',
    'admin',
    1
);
```

### Cách 2: Chạy script tự động

```bash
cd backend
node scripts/create-admin.js
```

---

## Bước 8: Khởi động Backend

```bash
cd backend
npm run dev
```

Kiểm tra:
- API: http://localhost:3000
- Health: http://localhost:3000/health
- API Docs: http://localhost:3000/api-docs

---

## 🔧 Troubleshooting

### Lỗi: "Cannot open database"

**Giải pháp:**
```sql
-- Kiểm tra database tồn tại
SELECT name FROM sys.databases;

-- Nếu không có, tạo lại
CREATE DATABASE clb_vo_co_truyen_hutech;
```

### Lỗi: "Login failed"

**Giải pháp:**
1. Sử dụng Windows Authentication
2. Hoặc enable SQL Server Authentication:
   - Chuột phải vào Server trong Object Explorer
   - Properties → Security
   - Chọn "SQL Server and Windows Authentication mode"
   - Restart SQL Server service

### Lỗi: "Invalid object name 'users'"

**Giải pháp:**
```sql
-- Kiểm tra tables
USE clb_vo_co_truyen_hutech;
SELECT * FROM INFORMATION_SCHEMA.TABLES;

-- Nếu không có tables, chạy lại schema
-- Copy nội dung từ mssql-schema.sql và execute
```

### Lỗi: "Connection timeout"

**Giải pháp:**
1. Kiểm tra SQL Server đang chạy:
   - Services → SQL Server (SQLEXPRESS) → Running
2. Enable TCP/IP:
   - SQL Server Configuration Manager
   - SQL Server Network Configuration
   - Protocols for SQLEXPRESS
   - Enable TCP/IP
   - Restart SQL Server

---

## 📊 Kiểm tra Database

### Xem tất cả tables:

```sql
USE clb_vo_co_truyen_hutech;

SELECT 
    t.name AS TableName,
    SUM(p.rows) AS RowCount
FROM sys.tables t
INNER JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
GROUP BY t.name
ORDER BY t.name;
```

### Xem structure của table:

```sql
EXEC sp_help 'users';
```

### Backup database:

```sql
BACKUP DATABASE clb_vo_co_truyen_hutech
TO DISK = 'C:\Backup\clb_vo_backup.bak'
WITH FORMAT, INIT, NAME = 'Full Backup';
```

---

## 🎯 Quick Commands

```sql
-- Switch database
USE clb_vo_co_truyen_hutech;

-- Count users
SELECT COUNT(*) FROM users;

-- List all users
SELECT id, email, full_name, role FROM users;

-- List all classes
SELECT id, name, instructor_id, status FROM classes;

-- List all events
SELECT id, name, type, date, status FROM events;

-- Clear all data (CAREFUL!)
EXEC sp_MSforeachtable 'DELETE FROM ?';

-- Drop database (CAREFUL!)
USE master;
DROP DATABASE clb_vo_co_truyen_hutech;
```

---

## ✅ Verification Checklist

- [ ] SQL Server đang chạy
- [ ] Database `clb_vo_co_truyen_hutech` đã tạo
- [ ] 12 tables đã tạo (users, sessions, classes, etc.)
- [ ] Admin user đã tạo
- [ ] Backend kết nối thành công
- [ ] API endpoints hoạt động

---

## 📞 Cần trợ giúp?

- Kiểm tra SQL Server error logs
- Kiểm tra backend logs trong `logs/error.log`
- Xem API documentation tại `/api-docs`

---

**Chúc bạn setup thành công! 🚀**
