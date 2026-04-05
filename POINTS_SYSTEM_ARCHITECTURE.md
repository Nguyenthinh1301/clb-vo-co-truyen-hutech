# 🏗️ KIẾN TRÚC HỆ THỐNG TÍCH ĐIỂM

## 📐 SƠ ĐỒ TỔNG QUAN

```
┌─────────────────────────────────────────────────────────────────┐
│                     HỆ THỐNG TÍCH ĐIỂM                          │
│                  CLB Võ Cổ Truyền HUTECH                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   ADMIN DASHBOARD    │         │   USER DASHBOARD     │
│  dashboard.html      │         │ user-dashboard.html  │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           │  Tab "Tích điểm"               │  Tab "Tích điểm"
           │  onclick="showSection('points')"│  onclick="UserDashboard_showSection('points')"
           │                                 │
           ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────┐
│ dashboard-core.js    │         │ user-dashboard.js    │
│ loadPointsContent()  │         │ loadPoints()         │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                 │
           │  fetch('points-content.html')  │  fetch('points-content.html')
           │                                 │
           └─────────────┬───────────────────┘
                         │
                         ▼
           ┌─────────────────────────┐
           │  points-content.html    │
           │  (1088 dòng)            │
           │  ┌───────────────────┐  │
           │  │ Inline CSS        │  │
           │  │ - Gradients       │  │
           │  │ - Animations      │  │
           │  │ - Responsive      │  │
           │  └───────────────────┘  │
           │  ┌───────────────────┐  │
           │  │ HTML Structure    │  │
           │  │ - 4 Stat Cards    │  │
           │  │ - Progress Bar    │  │
           │  │ - 4 Rank Levels   │  │
           │  │ - 4 Tabs          │  │
           │  │ - 9 Rewards       │  │
           │  └───────────────────┘  │
           │  ┌───────────────────┐  │
           │  │ JavaScript        │  │
           │  │ - Tab switching   │  │
           │  └───────────────────┘  │
           └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API (Tùy chọn)                     │
└─────────────────────────────────────────────────────────────────┘

           ┌─────────────────────────┐
           │   backend/server.js     │
           │   app.use('/api/points',│
           │   require('./routes/    │
           │   points'))             │
           └──────────┬──────────────┘
                      │
                      ▼
           ┌─────────────────────────┐
           │ backend/routes/points.js│
           │                         │
           │ GET  /user/:userId      │
           │ GET  /transactions/:id  │
           │ GET  /leaderboard       │
           │ GET  /rewards           │
           │ GET  /achievements      │
           │ GET  /user-achievements │
           │ POST /add (Admin only)  │
           └──────────┬──────────────┘
                      │
                      ▼
           ┌─────────────────────────┐
           │   MSSQL DATABASE        │
           │   (Tùy chọn)            │
           │                         │
           │ - user_points           │
           │ - points_transactions   │
           │ - rewards               │
           │ - achievements          │
           │ - user_achievements     │
           │ - reward_redemptions    │
           │ - points_rules          │
           └─────────────────────────┘
```

---

## 🔄 LUỒNG DỮ LIỆU

### Hiện tại (Static HTML)
```
User clicks "Tích điểm" tab
         ↓
JavaScript function called
         ↓
fetch('points-content.html')
         ↓
Load HTML into #points-content
         ↓
Display static data
```

### Tương lai (Dynamic API)
```
User clicks "Tích điểm" tab
         ↓
JavaScript function called
         ↓
fetch('/api/points/user/' + userId)
         ↓
Backend queries database
         ↓
Return JSON data
         ↓
JavaScript renders HTML with real data
         ↓
Display dynamic data
```

---

## 📁 CẤU TRÚC FILE

```
project/
│
├── backend/
│   ├── server.js                    ✅ Route registration
│   ├── routes/
│   │   └── points.js                ✅ API endpoints
│   ├── middleware/
│   │   └── auth.js                  ✅ Authentication
│   └── config/
│       └── database.js              ✅ MSSQL config
│
├── dashboard/
│   ├── dashboard.html               ✅ Admin dashboard
│   ├── user-dashboard.html          ✅ User dashboard
│   ├── points-content.html          ✅ Points UI (1088 lines)
│   │
│   ├── css/
│   │   ├── dashboard.css            ✅ Admin styles
│   │   ├── user-dashboard.css       ✅ User styles
│   │   └── points-system.css        ✅ Points styles
│   │
│   └── js/
│       ├── dashboard-core.js        ✅ Admin logic
│       └── user-dashboard.js        ✅ User logic
│
├── demo-features/
│   └── points-system/
│       ├── database/
│       │   ├── schema.sql           ✅ Database schema
│       │   └── sample-data.sql      ✅ Sample data
│       │
│       └── frontend/
│           └── user-points-dashboard.html  ✅ Original demo
│
└── docs/
    ├── VERIFY_POINTS_SYSTEM.md      ✅ Verification guide
    ├── TEST_POINTS_VISUAL.html      ✅ Visual test page
    ├── TICH_DIEM_HOAN_TAT.md        ✅ Completion summary
    └── POINTS_SYSTEM_ARCHITECTURE.md ✅ This file
```

---

## 🎨 COMPONENT BREAKDOWN

### 1. Stat Cards Component
```html
<div class="points-stats">
  <div class="stat-card purple">    <!-- Gradient purple -->
    <div class="stat-icon">📚</div>
    <div class="stat-label">Tổng điểm</div>
    <div class="stat-value">75</div>
  </div>
  <!-- 3 more cards: pink, blue, orange -->
</div>
```

### 2. Progress Bar Component
```html
<div class="rank-progress">
  <div class="rank-badge-large">
    <div class="emoji">🥇</div>
    <div class="name">Vàng</div>
  </div>
  
  <div class="progress-bar-wrapper">
    <div class="progress-bar-track">
      <div class="progress-bar-fill" style="width: 50%"></div>
    </div>
    <div class="progress-text">Còn 15 điểm để lên Kim Cương</div>
  </div>
  
  <div class="rank-badge-large">
    <div class="emoji">💎</div>
    <div class="name">Kim Cương</div>
  </div>
</div>
```

### 3. Rank Levels Component
```html
<div class="rank-levels-grid">
  <div class="rank-level-card completed">
    <div class="emoji">🥉</div>
    <div class="name">Đồng</div>
    <div class="range">0-29</div>
  </div>
  <!-- 3 more levels: Bạc, Vàng, Kim Cương -->
</div>
```

### 4. Tabs Component
```html
<div class="points-tabs">
  <button class="points-tab active" onclick="showPointsTab2('rewards')">
    <i class="fas fa-gift"></i> Đổi quà
  </button>
  <!-- 3 more tabs: Lịch sử, Bảng xếp hạng, Thành tích -->
</div>
```

### 5. Rewards Grid Component
```html
<div class="rewards-grid">
  <div class="reward-item">
    <div class="reward-icon">🌊</div>
    <div class="reward-name">Bình nước CLB</div>
    <div class="reward-desc">Bình nước thể thao có logo</div>
    <div class="reward-price">
      <i class="fas fa-coins"></i> 15 điểm
    </div>
    <button class="reward-btn">Đổi ngay</button>
  </div>
  <!-- 8 more rewards -->
</div>
```

---

## 🎯 DESIGN SYSTEM

### Color Palette
```css
/* Gradients */
--purple-gradient: linear-gradient(135deg, #667eea, #764ba2);
--pink-gradient: linear-gradient(135deg, #f093fb, #f5576c);
--blue-gradient: linear-gradient(135deg, #4facfe, #00f2fe);
--orange-gradient: linear-gradient(135deg, #fa709a, #fee140);
--green-gradient: linear-gradient(135deg, #11998e, #38ef7d);

/* Background */
--bg-light: #f5f7fa;
--bg-white: #ffffff;
--bg-card: #f8f9fa;

/* Text */
--text-primary: #333333;
--text-secondary: #666666;
--text-muted: #999999;
```

### Typography
```css
/* Headings */
h1: 24px, bold
h2: 18px, bold
h3: 16px, bold

/* Body */
body: 14px, normal
small: 12px, normal

/* Values */
stat-value: 36px, bold
```

### Spacing
```css
/* Padding */
card-padding: 20px
section-padding: 25px

/* Margin */
element-margin: 10px
section-margin: 20px

/* Gap */
grid-gap: 15px
flex-gap: 10px
```

### Border Radius
```css
/* Rounded corners */
small: 8px
medium: 12px
large: 15px
xlarge: 20px
circle: 50%
```

---

## 🔐 SECURITY & AUTHENTICATION

### Admin Dashboard
```javascript
// Check authentication
if (!Auth.isAuthenticated()) {
    redirect to login
}

// Check admin role
if (user.role !== 'admin') {
    show access denied
}
```

### User Dashboard
```javascript
// Check authentication
if (!Auth.isAuthenticated()) {
    redirect to login
}

// Prevent admin access
if (user.role === 'admin') {
    redirect to admin dashboard
}
```

### API Endpoints
```javascript
// All endpoints require authentication
router.get('/user/:userId', auth, async (req, res) => {
    // User can only view their own data
    if (currentUser.role !== 'admin' && 
        currentUser.id !== parseInt(userId)) {
        return 403 Forbidden
    }
    // ...
});

// Admin-only endpoints
router.post('/add', auth, async (req, res) => {
    if (currentUser.role !== 'admin') {
        return 403 Forbidden
    }
    // ...
});
```

---

## 📊 DATABASE SCHEMA

### Tables (7 tables)
```
1. user_points
   - user_id (PK)
   - total_points
   - available_points
   - spent_points
   - rank_level
   - streak_days

2. points_transactions
   - id (PK)
   - user_id (FK)
   - points
   - transaction_type
   - category
   - description
   - reference_id
   - reference_type
   - created_by
   - created_at

3. rewards
   - id (PK)
   - name
   - description
   - points_required
   - icon
   - is_active
   - display_order

4. reward_redemptions
   - id (PK)
   - user_id (FK)
   - reward_id (FK)
   - points_spent
   - status
   - redeemed_at

5. achievements
   - id (PK)
   - name
   - description
   - icon
   - points_reward
   - requirement_type
   - requirement_value
   - is_active

6. user_achievements
   - id (PK)
   - user_id (FK)
   - achievement_id (FK)
   - earned_at

7. points_rules
   - id (PK)
   - rule_name
   - category
   - points
   - description
   - is_active
```

### Views
```sql
v_leaderboard
  - Rank users by total_points
  - Include user info and rank_level

v_user_points_summary
  - User points with rank info
  - Transaction counts
  - Achievement counts
```

### Stored Procedures
```sql
sp_add_points
  - Add points to user
  - Create transaction record
  - Update rank if needed

sp_redeem_reward
  - Check if user has enough points
  - Deduct points
  - Create redemption record
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Development
- [x] Backend API created
- [x] Frontend UI created
- [x] Static data working
- [x] Authentication working
- [x] Both dashboards integrated

### Production (Optional)
- [ ] Run database schema
- [ ] Load sample data
- [ ] Connect API to database
- [ ] Update frontend to use API
- [ ] Test all endpoints
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add success/error messages

---

## 📈 FUTURE ENHANCEMENTS

### Phase 1: Dynamic Data
- Connect frontend to backend API
- Load real user points from database
- Real-time updates

### Phase 2: Gamification
- Daily check-in system
- Streak bonuses
- Achievement notifications
- Leaderboard competitions

### Phase 3: Rewards Management
- Admin can add/edit rewards
- Reward inventory tracking
- Redemption approval workflow
- Email notifications

### Phase 4: Analytics
- Points earning trends
- Popular rewards
- User engagement metrics
- ROI analysis

---

## 🎓 LEARNING RESOURCES

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: Microsoft SQL Server
- **Authentication**: JWT tokens
- **Icons**: Font Awesome 6
- **Design**: Gradient UI, Emoji icons

### Key Concepts
- RESTful API design
- Authentication & Authorization
- Responsive web design
- Component-based architecture
- Database normalization
- Stored procedures

---

## 📞 SUPPORT

### Documentation
- `VERIFY_POINTS_SYSTEM.md` - Detailed verification guide
- `TICH_DIEM_HOAN_TAT.md` - Completion summary (Vietnamese)
- `TEST_POINTS_VISUAL.html` - Visual test page

### Quick Links
- Admin Dashboard: `http://localhost:3000/dashboard/dashboard.html`
- User Dashboard: `http://localhost:3000/dashboard/user-dashboard.html`
- API Health: `http://localhost:3000/api/health`

### Troubleshooting
1. Check console for errors (F12)
2. Verify backend is running
3. Hard refresh browser (Ctrl+Shift+R)
4. Clear browser cache
5. Try incognito mode

---

**Hệ thống tích điểm đã sẵn sàng! 🎉**

*Architecture designed by Kiro AI Assistant - 2025*
