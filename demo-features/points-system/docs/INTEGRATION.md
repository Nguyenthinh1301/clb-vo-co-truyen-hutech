# Hướng Dẫn Tích Hợp Hệ Thống Tích Điểm

## Tổng Quan

Tài liệu này hướng dẫn cách tích hợp hệ thống tích điểm vào dự án chính.

## Bước 1: Setup Database

### 1.1. Chạy Schema

```bash
# Mở SSMS và chạy
demo-features/points-system/database/schema.sql
```

### 1.2. Insert Sample Data

```bash
# Chạy tiếp
demo-features/points-system/database/sample-data.sql
```

### 1.3. Verify

```sql
-- Kiểm tra tables đã tạo
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME LIKE '%point%' OR TABLE_NAME LIKE '%reward%' OR TABLE_NAME LIKE '%achievement%';

-- Kiểm tra dữ liệu
SELECT * FROM user_points;
SELECT * FROM rewards;
SELECT * FROM achievements;
```

## Bước 2: Backend Integration

### 2.1. Copy Routes

```bash
# Copy các file route vào backend
cp demo-features/points-system/backend/routes/*.js backend/routes/
```

### 2.2. Update server.js

Thêm vào `backend/server.js`:

```javascript
// Points System Routes
app.use('/api/points', require('./routes/points'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
```

### 2.3. Test API

```bash
# Start backend
cd backend
npm start

# Test endpoints
curl http://localhost:3000/api/points/my-points
curl http://localhost:3000/api/rewards/list
curl http://localhost:3000/api/leaderboard
```

## Bước 3: Frontend Integration

### 3.1. Copy Frontend Files

```bash
# Copy vào dashboard
cp demo-features/points-system/frontend/user-points-dashboard.html dashboard/user-points.html
cp demo-features/points-system/frontend/css/points-system.css dashboard/css/
cp demo-features/points-system/frontend/js/points-dashboard.js dashboard/js/
```

### 3.2. Add Tab to User Dashboard

Thêm vào `dashboard/user-dashboard.html`:

```html
<a href="#" class="nav-tab" onclick="UserDashboard_showSection('points', event)">
    <i class="fas fa-star"></i>
    <span>Tích điểm</span>
</a>
```

### 3.3. Add Section

```html
<div id="points-section" class="content-section">
    <!-- Load points dashboard here -->
</div>
```

### 3.4. Update dashboard-core.js

```javascript
case 'points':
    loadPointsSection();
    break;
```

## Bước 4: Admin Integration

### 4.1. Add Admin Tab

Thêm vào `dashboard/dashboard.html`:

```html
<button class="nav-tab" onclick="showSection('points-management')">
    <i class="fas fa-star"></i> Quản lý điểm
</button>
```

### 4.2. Create Admin Section

```html
<div id="points-management-section" class="content-section">
    <!-- Admin points management -->
</div>
```

## Bước 5: Auto Points Award

### 5.1. Attendance Points

Thêm vào `backend/routes/attendance.js`:

```javascript
// After marking attendance
await db.query('EXEC sp_add_points @user_id=?, @points=10, @category=?, @description=?', 
    [userId, 'attendance', 'Điểm danh lớp học']);
```

### 5.2. Event Points

Thêm vào `backend/routes/events.js`:

```javascript
// After event registration
await db.query('EXEC sp_add_points @user_id=?, @points=20, @category=?, @description=?',
    [userId, 'event', `Tham gia sự kiện ${eventName}`]);
```

### 5.3. Achievement Points

```javascript
// When user achieves something
await db.query('EXEC sp_add_points @user_id=?, @points=?, @category=?, @description=?',
    [userId, points, 'achievement', description]);
```

## Bước 6: Testing

### 6.1. Test User Flow

1. Đăng nhập user
2. Vào tab "Tích điểm"
3. Xem điểm hiện tại
4. Đổi quà
5. Xem lịch sử
6. Kiểm tra bảng xếp hạng

### 6.2. Test Admin Flow

1. Đăng nhập admin
2. Vào "Quản lý điểm"
3. Thêm điểm cho user
4. Duyệt đổi quà
5. Xem thống kê

### 6.3. Test Auto Points

1. Điểm danh lớp → Check +10 điểm
2. Tham gia sự kiện → Check +20 điểm
3. Hoàn thành bài tập → Check +15 điểm

## Bước 7: Customization

### 7.1. Adjust Points Rules

```sql
-- Thay đổi điểm cho các hoạt động
UPDATE points_rules SET points = 15 WHERE category = 'attendance';
```

### 7.2. Add New Rewards

```sql
INSERT INTO rewards (name, description, points_required, category, stock_quantity)
VALUES ('Tên quà', 'Mô tả', 500, 'merchandise', 10);
```

### 7.3. Create New Achievements

```sql
INSERT INTO achievements (name, description, icon, points_reward, category)
VALUES ('Tên thành tích', 'Mô tả', '🏆', 100, 'special');
```

## Bước 8: Monitoring

### 8.1. Check Points Activity

```sql
-- Xem hoạt động tích điểm
SELECT TOP 100 * FROM points_transactions ORDER BY created_at DESC;
```

### 8.2. Monitor Redemptions

```sql
-- Xem đổi quà
SELECT * FROM reward_redemptions WHERE status = 'pending';
```

### 8.3. Leaderboard

```sql
-- Xem bảng xếp hạng
SELECT * FROM v_leaderboard;
```

## Troubleshooting

### Lỗi: "Table not found"

**Giải pháp**: Chạy lại schema.sql

### Lỗi: "Stored procedure not found"

**Giải pháp**: Kiểm tra sp_add_points đã được tạo chưa

### Lỗi: "Foreign key constraint"

**Giải pháp**: Đảm bảo users table có dữ liệu

## Best Practices

1. **Backup trước khi tích hợp**
2. **Test trên môi trường dev trước**
3. **Monitor performance sau khi deploy**
4. **Có kế hoạch rollback nếu cần**

## Support

Nếu gặp vấn đề khi tích hợp:
1. Kiểm tra logs
2. Verify database schema
3. Test API endpoints
4. Check frontend console

## Next Steps

Sau khi tích hợp thành công:
- [ ] Thêm email notification khi đổi quà
- [ ] Tạo push notification cho điểm mới
- [ ] Thêm gamification elements
- [ ] Tạo monthly leaderboard reset
- [ ] Add social sharing features
