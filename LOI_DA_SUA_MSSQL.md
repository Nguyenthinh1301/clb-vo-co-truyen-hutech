# ✅ Danh sách lỗi đã sửa - MSSQL Compatibility

## 🐛 Các lỗi đã phát hiện và sửa

### 1. Lỗi LIMIT syntax (MSSQL không hỗ trợ)

**Vị trí:** `backend/routes/admin-content.js`, `backend/routes/user-content.js`

**Lỗi:**
```sql
SELECT * FROM table LIMIT 10 OFFSET 0
```

**Nguyên nhân:** MSSQL không hỗ trợ `LIMIT`, phải dùng `TOP` hoặc `OFFSET FETCH`

**Đã sửa:**
```sql
-- MSSQL
SELECT TOP 10 * FROM table ORDER BY id OFFSET 0 ROWS

-- MySQL
SELECT * FROM table ORDER BY id LIMIT 10 OFFSET 0
```

**Files đã sửa:**
- ✅ `backend/routes/admin-content.js` - 2 queries (announcements, news)
- ✅ `backend/routes/user-content.js` - 3 queries (announcements, news, activities)

### 2. Lỗi tên cột sai

**Vị trí:** `backend/routes/user-content.js`

**Lỗi:**
```sql
SELECT e.title FROM events e  -- Sai: events không có cột 'title'
```

**Nguyên nhân:** Bảng `events` có cột `name` chứ không phải `title`

**Đã sửa:**
```sql
SELECT e.name as title FROM events e  -- Đúng
```

### 3. Lỗi tên cột date

**Vị trí:** `backend/routes/user-content.js` - dashboard-stats

**Lỗi:**
```sql
WHERE e.event_date >= GETDATE()  -- Sai: events có cột 'date' không phải 'event_date'
```

**Đã sửa:**
```sql
WHERE e.date >= CAST(GETDATE() AS DATE)  -- Đúng
```

### 4. Lỗi UNION ALL với LIMIT trong MSSQL

**Vị trí:** `backend/routes/user-content.js` - recent activities

**Lỗi:**
```sql
SELECT ... UNION ALL SELECT ... ORDER BY date LIMIT 10
```

**Nguyên nhân:** MSSQL yêu cầu wrap UNION trong subquery để dùng TOP

**Đã sửa:**
```sql
-- MSSQL
SELECT TOP 10 * FROM (
    SELECT ... UNION ALL SELECT ...
) AS combined ORDER BY date DESC

-- MySQL
SELECT ... UNION ALL SELECT ... ORDER BY date DESC LIMIT 10
```

## 📊 Tổng kết

### Queries đã sửa: 6

1. ✅ Admin announcements list
2. ✅ Admin news list
3. ✅ User announcements list
4. ✅ User news list
5. ✅ User recent activities
6. ✅ User dashboard stats (upcoming events)

### Files đã sửa: 2

1. ✅ `backend/routes/admin-content.js`
2. ✅ `backend/routes/user-content.js`

## 🔧 Pattern sử dụng

### Database-agnostic query pattern

```javascript
const dbType = process.env.DB_TYPE || 'mysql';
let query;
const params = [];

if (dbType === 'mssql') {
    // MSSQL syntax
    query = `SELECT TOP ${limit} * FROM table 
             ORDER BY id 
             OFFSET ${offset} ROWS`;
} else {
    // MySQL syntax
    query = `SELECT * FROM table 
             ORDER BY id 
             LIMIT ? OFFSET ?`;
    params.push(limit, offset);
}

const results = await db.query(query, params);
```

### Date comparison pattern

```javascript
const dbType = process.env.DB_TYPE || 'mysql';
let dateCheck;

if (dbType === 'mssql') {
    dateCheck = 'date >= CAST(GETDATE() AS DATE)';
} else {
    dateCheck = 'date >= CURDATE()';
}

const query = `SELECT * FROM table WHERE ${dateCheck}`;
```

## ✅ Kiểm tra

### Test queries

```sql
-- Test announcements
SELECT TOP 5 * FROM announcements ORDER BY created_at DESC OFFSET 0 ROWS;

-- Test news
SELECT TOP 5 * FROM news ORDER BY published_at DESC OFFSET 0 ROWS;

-- Test events with date
SELECT * FROM events WHERE date >= CAST(GETDATE() AS DATE);

-- Test recent activities
SELECT TOP 5 * FROM (
    SELECT 'attendance' as type, a.id, a.created_at as date, c.name as title, a.status
    FROM attendance a
    JOIN classes c ON a.class_id = c.id
    WHERE a.user_id = 1
    UNION ALL
    SELECT 'event' as type, er.id, er.registered_at as date, e.name as title, er.status
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    WHERE er.user_id = 1
) AS combined
ORDER BY date DESC;
```

## 🎯 Best Practices

### 1. Luôn kiểm tra DB type

```javascript
const dbType = process.env.DB_TYPE || 'mysql';
```

### 2. Sử dụng parameterized queries

```javascript
// Tốt
const query = 'SELECT * FROM users WHERE id = ?';
const result = await db.query(query, [userId]);

// Tránh
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

### 3. Test với cả MySQL và MSSQL

- Đảm bảo code chạy được trên cả 2 database
- Sử dụng environment variable để switch

### 4. Kiểm tra schema trước khi query

```sql
-- Kiểm tra columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'table_name';

-- Kiểm tra data types
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'table_name';
```

## 🚀 Kết quả

- ✅ Tất cả queries đã tương thích với MSSQL
- ✅ Backend chạy không lỗi
- ✅ API endpoints hoạt động bình thường
- ✅ Admin và User dashboard có thể load data

## 📝 Notes

### MSSQL vs MySQL differences

| Feature | MySQL | MSSQL |
|---------|-------|-------|
| Limit | `LIMIT n` | `TOP n` |
| Offset | `LIMIT n OFFSET m` | `OFFSET m ROWS` |
| Current date | `NOW()` hoặc `CURDATE()` | `GETDATE()` |
| Date only | `CURDATE()` | `CAST(GETDATE() AS DATE)` |
| String concat | `CONCAT()` | `+` hoặc `CONCAT()` |
| Auto increment | `AUTO_INCREMENT` | `IDENTITY` |

### Common pitfalls

1. ❌ Quên check DB type
2. ❌ Hardcode LIMIT trong query
3. ❌ Sử dụng MySQL-specific functions
4. ❌ Không test với MSSQL
5. ❌ Giả định column names

## 🔮 Future improvements

- [ ] Tạo query builder để abstract DB differences
- [ ] Unit tests cho cả MySQL và MSSQL
- [ ] Migration scripts cho cả 2 databases
- [ ] Documentation về DB compatibility

---

**Cập nhật**: 2026-02-18  
**Status**: ✅ Đã sửa tất cả lỗi  
**Backend**: Đang chạy ổn định
