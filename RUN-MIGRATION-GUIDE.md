# 🔧 HƯỚNG DẪN CHẠY MIGRATION - Fix Lỗi VARCHAR

**Vấn đề:** `value too long for type character varying(500)`  
**Giải pháp:** Tăng VARCHAR limits từ 500 → 1000 characters

---

## ⚠️ QUAN TRỌNG

**Bạn PHẢI chạy migration này trên production database để fix lỗi!**

Không chạy migration = lỗi vẫn còn khi thêm tin tức dài.

---

## 🎯 CÁCH CHẠY MIGRATION

### Option 1: Sử Dụng Render Dashboard (Easiest)

**Bước 1: Truy cập Render Dashboard**
```
URL: https://dashboard.render.com
Login với tài khoản của bạn
```

**Bước 2: Mở Database**
```
1. Trong dashboard, chọn "Databases"
2. Click vào database của project (PostgreSQL)
3. Chọn tab "Info"
```

**Bước 3: Kết nối qua psql**
```
1. Copy "External Database URL" 
2. Mở terminal/PowerShell
3. Chạy lệnh:
   psql "<paste-database-url-here>"
```

**Bước 4: Chạy Migration**
```sql
-- Copy toàn bộ nội dung file này và paste vào psql:
-- backend/database/migrations/001_increase_varchar_limits.sql

BEGIN;

ALTER TABLE news ALTER COLUMN excerpt TYPE VARCHAR(1000);
ALTER TABLE news ALTER COLUMN tags TYPE VARCHAR(1000);
ALTER TABLE news ALTER COLUMN featured_image TYPE VARCHAR(1000);
ALTER TABLE gallery_albums ALTER COLUMN cover_image TYPE VARCHAR(1000);
ALTER TABLE events ALTER COLUMN featured_image TYPE VARCHAR(1000);
ALTER TABLE announcements ALTER COLUMN image_url TYPE VARCHAR(1000);
ALTER TABLE reviews ALTER COLUMN avatar_url TYPE VARCHAR(1000);

COMMIT;
```

**Bước 5: Verify**
```sql
-- Check column types
SELECT column_name, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'news' 
AND column_name IN ('excerpt', 'tags', 'featured_image');

-- Should show 1000 for all three columns
```

---

### Option 2: Sử Dụng Script Node.js (Recommended for Developers)

**Bước 1: Setup Environment**
```bash
cd backend

# Create .env.production if not exists
echo "DATABASE_URL=<your-render-database-url>" > .env.production
```

**Bước 2: Chạy Migration**
```bash
node scripts/run-migration.js 001_increase_varchar_limits.sql
```

**Output mong đợi:**
```
🔄 Running migration: 001_increase_varchar_limits.sql
Database: your-database-name
---
Migration SQL:
...
Executing: ALTER TABLE news ALTER COLUMN excerpt TYPE VARCHAR(1000)...
✅ Success
...
✅ Migration completed successfully!
```

---

### Option 3: Render Shell (Advanced)

**Bước 1: Connect to Render Shell**
```
1. Dashboard → Database
2. Click "Shell" tab
3. Wait for shell to connect
```

**Bước 2: Chạy SQL Commands**
```sql
-- Paste từng lệnh một
ALTER TABLE news ALTER COLUMN excerpt TYPE VARCHAR(1000);
ALTER TABLE news ALTER COLUMN tags TYPE VARCHAR(1000);
ALTER TABLE news ALTER COLUMN featured_image TYPE VARCHAR(1000);
-- ... etc
```

---

## ✅ XÁC NHẬN MIGRATION THÀNH CÔNG

### Test 1: Check Column Types
```sql
SELECT 
    table_name, 
    column_name, 
    character_maximum_length 
FROM information_schema.columns 
WHERE table_name IN ('news', 'events', 'gallery_albums')
AND column_name LIKE '%image%' OR column_name IN ('excerpt', 'tags');
```

**Kết quả mong đợi:** Tất cả đều là 1000

### Test 2: Thử Thêm Tin Tức Dài

```bash
# Trên frontend
1. Login vào admin: https://vocotruyenhutech.netlify.app/admin/
2. Vào "Quản lý Tin tức"
3. Click "Thêm tin tức mới"
4. Nhập nội dung dài (>500 ký tự) vào tóm tắt
5. Click "Lưu bài viết"
6. Không còn lỗi "value too long" nữa ✅
```

---

## 🔄 NẾU GẶP VẤN ĐỀ

### Lỗi: "relation does not exist"
**Nguyên nhân:** Database chưa có table  
**Giải pháp:** Chạy full schema trước:
```bash
psql $DATABASE_URL < backend/database/pg-schema.sql
```

### Lỗi: "permission denied"
**Nguyên nhân:** User không có quyền ALTER TABLE  
**Giải pháp:** Dùng owner user từ Render dashboard

### Lỗi: "cannot connect to database"
**Nguyên nhân:** DATABASE_URL sai hoặc database down  
**Giải pháp:** 
1. Check database status trên Render
2. Verify DATABASE_URL
3. Check firewall/network

### Migration đã chạy nhưng vẫn lỗi?
**Nguyên nhân:** Backend cache hoặc chưa restart  
**Giải pháp:**
1. Restart backend service trên Render
2. Clear application cache
3. Deploy lại backend

---

## 📊 TÓM TẮT THAY ĐỔI

| Table | Column | Old Limit | New Limit |
|-------|--------|-----------|-----------|
| news | excerpt | 500 | 1000 |
| news | tags | 500 | 1000 |
| news | featured_image | 500 | 1000 |
| gallery_albums | cover_image | 500 | 1000 |
| events | featured_image | 500 | 1000 |
| announcements | image_url | 500 | 1000 |
| reviews | avatar_url | 500 | 1000 |

---

## 🎯 CHECKLIST

Trước khi chạy migration:
- [ ] Backup database (Render tự động backup hàng ngày)
- [ ] Đọc migration script: `backend/database/migrations/001_increase_varchar_limits.sql`
- [ ] Có DATABASE_URL của production
- [ ] Có quyền truy cập Render dashboard

Chạy migration:
- [ ] Chọn method (Dashboard/Script/Shell)
- [ ] Execute migration commands
- [ ] Check for errors
- [ ] Verify với SELECT query

Sau migration:
- [ ] Test thêm tin tức với content dài
- [ ] Restart backend nếu cần
- [ ] Update documentation
- [ ] Thông báo team

---

## 📞 HỖ TRỢ

Nếu cần help:
1. Check logs: `backend/database/migrations/README.md`
2. Check file: `RUN-MIGRATION-GUIDE.md` (this file)
3. Contact: vctht2026@gmail.com

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi chạy migration thành công:
- ✅ Có thể thêm tin tức với excerpt dài (>500 chars)
- ✅ Không còn lỗi "value too long"
- ✅ Có thể upload ảnh với URL dài
- ✅ Tags có thể dài hơn 500 chars

---

**Tạo bởi:** Kiro AI  
**Ngày:** 10/06/2026  
**Mục đích:** Fix lỗi VARCHAR limit trong database production
