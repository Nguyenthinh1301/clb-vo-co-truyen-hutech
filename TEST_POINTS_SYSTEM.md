# Test Hệ Thống Tích Điểm

## Bước 1: Kiểm tra Database

Mở SQL Server Management Studio và chạy:

```sql
USE clb_vo_co_truyen_hutech;
GO

-- Kiểm tra tables đã tạo chưa
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('user_points', 'points_transactions', 'rewards', 'achievements');

-- Nếu chưa có, chạy file này:
-- demo-features/points-system/database/schema.sql
```

## Bước 2: Kiểm tra Backend

1. Mở terminal và chạy:
```bash
cd backend
npm start
```

2. Kiểm tra log có dòng này không:
```
Server running on port 5000
```

3. Test API bằng browser:
```
http://localhost:5000/api/health
```

## Bước 3: Kiểm tra Frontend

1. Mở Chrome DevTools (F12)
2. Vào tab Console
3. Xem có lỗi gì không

### Lỗi thường gặp:

**Lỗi 1: "Cannot read properties of undefined"**
→ Database chưa có tables
→ Giải pháp: Chạy schema.sql

**Lỗi 2: "Network Error" hoặc "Failed to fetch"**
→ Backend chưa chạy hoặc CORS issue
→ Giải pháp: Restart backend

**Lỗi 3: "DashboardPoints is not defined"**
→ File dashboard-points.js chưa load
→ Giải pháp: Kiểm tra dashboard.html đã include script chưa

**Lỗi 4: "apiClient is not defined"**
→ File api-client.js chưa load trước
→ Giải pháp: Kiểm tra thứ tự script trong HTML

## Bước 4: Test nhanh

Mở Console trong browser và chạy:

```javascript
// Test 1: Kiểm tra Auth
console.log('Current User:', Auth.getCurrentUser());

// Test 2: Kiểm tra API Client
console.log('API Client:', typeof apiClient);

// Test 3: Kiểm tra DashboardPoints
console.log('DashboardPoints:', typeof DashboardPoints);

// Test 4: Test API trực tiếp
fetch('http://localhost:5000/api/points/leaderboard', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));
```

## Bước 5: Nếu vẫn lỗi

Gửi cho tôi:
1. Screenshot của Console (F12 → Console tab)
2. Screenshot của Network tab (F12 → Network tab)
3. Log từ backend terminal

## Quick Fix

Nếu muốn test nhanh mà không cần database, tạm thời comment dòng này trong dashboard-points.js:

```javascript
// await this.loadUserPoints();
```

Và thêm:

```javascript
this.userPoints = {
    user_id: this.currentUser.id,
    total_points: 75,
    available_points: 60,
    spent_points: 15,
    rank_level: 'gold',
    streak_days: 7
};
```

Sau đó refresh lại trang.
