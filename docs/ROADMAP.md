# 🗺️ FEATURE IMPLEMENTATION ROADMAP

**Dự án:** CLB Võ Cổ Truyền HUTECH  
**Ngày tạo:** 19/09/2026  
**Status:** Planning Phase

---

## 📋 TỔNG QUAN

Roadmap chi tiết về **VỊ TRÍ** và **CÁCH THỨC** bổ sung các tính năng được khuyến nghị từ Admin Login Audit.

---

## 🎯 PRIORITY 1: CRITICAL ENHANCEMENTS

### 1. ✅ Add Automated Tests

#### 📍 Vị Trí Bổ Sung

```
backend/
├── tests/
│   ├── auth.test.js                    # ✅ Đã có (cần mở rộng)
│   ├── services.test.js                # ✅ Đã có
│   ├── database.test.js                # 📝 Cần tạo mới
│   ├── routes/                         # 📁 Tạo mới
│   │   ├── auth.routes.test.js         # 🆕 Admin login tests
│   │   ├── users.routes.test.js        # 🆕 User management tests
│   │   ├── contact.routes.test.js      # 🆕 Contact form tests
│   │   └── cms.routes.test.js          # 🆕 CMS endpoints tests
│   ├── middleware/                     # 📁 Tạo mới
│   │   ├── auth.middleware.test.js     # 🆕 Auth middleware tests
│   │   └── validation.middleware.test.js # 🆕 Validation tests
│   └── integration/                    # 📁 Tạo mới
│       ├── admin-login.integration.test.js  # 🆕 Full login flow
│       └── contact-flow.integration.test.js # 🆕 Contact form flow
```

#### 📝 Files Cần Tạo

**1. `backend/tests/routes/auth.routes.test.js`**
```javascript
describe('POST /api/auth/login', () => {
  it('should login admin successfully')
  it('should reject wrong password')
  it('should reject non-admin user')
  it('should reject inactive account')
  it('should respect rate limiting')
})
```

**2. `backend/tests/middleware/auth.middleware.test.js`**
```javascript
describe('authenticate middleware', () => {
  it('should accept valid token')
  it('should reject expired token')
  it('should reject invalid token')
  it('should check session in DB')
})
```

**3. `backend/tests/integration/admin-login.integration.test.js`**
```javascript
describe('Admin Login Flow', () => {
  it('should complete full login flow')
  it('should create session in DB')
  it('should log login attempt')
})
```

#### 📦 Dependencies Cần Thêm

Đã có trong `package.json`:
- ✅ `jest` - Test runner
- ✅ `supertest` - HTTP testing

#### 🔧 Commands

```json
// backend/package.json (đã có, chỉ cần sử dụng)
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest tests/services.test.js",
    "test:integration": "jest tests/auth.test.js tests/database.test.js"
  }
}
```

---

### 2. 📚 Complete API Documentation

#### 📍 Vị Trí Bổ Sung

```
backend/
├── config/
│   └── swagger.js                      # ✅ Đã có (cần mở rộng)
├── routes/
│   ├── auth.js                         # 📝 Thêm JSDoc comments
│   ├── users.js                        # 📝 Thêm JSDoc comments
│   └── ...                             # 📝 Thêm JSDoc comments
└── docs/                               # 📁 Tạo mới
    ├── api/                            # 📁 Tạo mới
    │   ├── authentication.md           # 🆕 Auth endpoints docs
    │   ├── users.md                    # 🆕 User endpoints docs
    │   ├── cms.md                      # 🆕 CMS endpoints docs
    │   └── examples.md                 # 🆕 Request/Response examples
    └── postman/                        # 📁 Tạo mới
        └── CLB-HUTECH-API.postman_collection.json  # 🆕 Postman collection
```

#### 📝 Files Cần Tạo/Sửa

**1. `backend/config/swagger.js`** (mở rộng)
```javascript
// Thêm chi tiết cho mỗi endpoint
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login endpoint
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@vocotruyenhutech.edu.vn
 *               password:
 *                 type: string
 *                 example: <mật khẩu admin>
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 */
```

**2. `backend/docs/api/authentication.md`**
```markdown
# Authentication API

## POST /api/auth/login
Login endpoint for admin users

### Request
...

### Response
...

### Error Codes
- 401: Invalid credentials
- 429: Rate limited
...
```

**3. `backend/docs/postman/CLB-HUTECH-API.postman_collection.json`**
- Export từ Postman hoặc tạo manually
- Chứa tất cả endpoints với examples

#### 🌐 Access Documentation

- **Local:** http://localhost:3001/api-docs
- **Production:** Disable (security)

---

### 3. 🔑 Implement Password Reset Flow

#### 📍 Vị Trí Bổ Sung

```
backend/
├── routes/
│   └── auth.js                         # 📝 Thêm routes mới
├── services/
│   └── emailService.js                 # 📝 Thêm email templates
├── database/
│   ├── pg-schema.sql                   # 📝 Thêm table mới
│   └── mssql-schema.sql                # 📝 Thêm table mới
└── templates/                          # 📁 Tạo mới
    └── emails/                         # 📁 Tạo mới
        ├── password-reset-request.html # 🆕 Email template
        └── password-reset-success.html # 🆕 Success email

website/
├── admin/
│   ├── forgot-password.html            # 🆕 Forgot password page
│   └── reset-password.html             # 🆕 Reset password page (với token)
```

#### 📝 Database Schema Changes

**1. Thêm vào `backend/database/pg-schema.sql`**
```sql
-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMP NOT NULL,
    used            BOOLEAN DEFAULT FALSE,
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);
```

**2. Thêm vào `backend/database/mssql-schema.sql`**
```sql
-- Tương tự nhưng syntax MSSQL
```

#### 📝 Backend Routes Cần Thêm

**`backend/routes/auth.js`** - Thêm các routes:

```javascript
// Request password reset
router.post('/forgot-password', async (req, res) => {
  // 1. Verify email exists
  // 2. Generate secure token
  // 3. Save to password_reset_tokens table
  // 4. Send email with reset link
  // 5. Return success (don't reveal if email exists)
})

// Verify reset token
router.get('/reset-password/:token', async (req, res) => {
  // 1. Check token exists and not expired
  // 2. Check not used
  // 3. Return token validity
})

// Reset password with token
router.post('/reset-password', async (req, res) => {
  // 1. Verify token
  // 2. Hash new password
  // 3. Update user password
  // 4. Mark token as used
  // 5. Revoke all user sessions
  // 6. Send confirmation email
})
```

#### 🎨 Frontend Pages Cần Tạo

**1. `website/admin/forgot-password.html`**
```html
<!-- Form nhập email -->
<!-- Gửi POST /api/auth/forgot-password -->
<!-- Hiện message: "Kiểm tra email để reset password" -->
```

**2. `website/admin/reset-password.html`**
```html
<!-- Nhận token từ URL: ?token=xxx -->
<!-- Form nhập password mới + confirm -->
<!-- Gửi POST /api/auth/reset-password -->
<!-- Redirect về login sau khi success -->
```

#### 📧 Email Templates

**`backend/templates/emails/password-reset-request.html`**
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <h1>Đặt lại mật khẩu</h1>
  <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
  <a href="{{resetLink}}">Đặt lại mật khẩu</a>
  <p>Link có hiệu lực trong 1 giờ.</p>
</body>
</html>
```

#### ⏱️ Estimated Time: 6-8 hours

---

## 🔐 PRIORITY 2: ADVANCED FEATURES

### 1. 🔐 Two-Factor Authentication (2FA)

#### 📍 Vị Trí Bổ Sung

```
backend/
├── routes/
│   └── auth.js                         # 📝 Thêm 2FA endpoints
├── middleware/
│   └── auth.js                         # 📝 Thêm 2FA verification
├── services/
│   └── twoFactorService.js             # 🆕 2FA logic (TOTP)
└── database/
    ├── pg-schema.sql                   # ✅ Đã có columns (two_factor_*)
    └── mssql-schema.sql                # ✅ Đã có columns

website/admin/
├── index.html                          # 📝 Thêm 2FA input (conditional)
├── setup-2fa.html                      # 🆕 Setup 2FA page
└── verify-2fa.html                     # 🆕 Verify TOTP code
```

#### 📦 Dependencies

```bash
npm install speakeasy qrcode
```

**Đã có trong package.json:**
- ✅ `speakeasy` - TOTP generation
- ✅ `qrcode` - QR code generation

#### 📝 Backend Implementation

**1. `backend/services/twoFactorService.js`** (tạo mới)
```javascript
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

class TwoFactorService {
  // Generate secret
  static generateSecret(email) {
    return speakeasy.generateSecret({
      name: `CLB HUTECH (${email})`,
      length: 32
    });
  }

  // Generate QR code
  static async generateQRCode(secret) {
    return await qrcode.toDataURL(secret.otpauth_url);
  }

  // Verify TOTP token
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    // Generate 10 backup codes (8 digits each)
  }
}
```

**2. `backend/routes/auth.js`** - Thêm routes:

```javascript
// Enable 2FA - Step 1: Generate secret & QR
router.post('/2fa/setup', authenticate, async (req, res) => {
  // 1. Generate secret
  // 2. Generate QR code
  // 3. Return secret + QR (don't save yet)
})

// Enable 2FA - Step 2: Verify & activate
router.post('/2fa/enable', authenticate, async (req, res) => {
  // 1. Verify TOTP code with secret
  // 2. Save secret to DB (encrypted)
  // 3. Generate backup codes
  // 4. Set two_factor_enabled = true
  // 5. Return backup codes
})

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res) => {
  // 1. Verify password
  // 2. Set two_factor_enabled = false
  // 3. Clear two_factor_secret
})

// Verify 2FA during login
router.post('/2fa/verify', async (req, res) => {
  // 1. Check temporary session (từ login step 1)
  // 2. Verify TOTP code
  // 3. Complete login (return full token)
})
```

**3. `backend/routes/auth.js`** - Sửa login flow:

```javascript
router.post('/login', async (req, res) => {
  // ... existing password verification ...

  // NEW: Check if 2FA enabled
  if (user.two_factor_enabled) {
    // Don't return full token yet
    // Create temporary session
    const tempToken = generateTempToken(user.id);
    
    return res.json({
      success: true,
      requires2FA: true,
      tempToken: tempToken,
      message: 'Vui lòng nhập mã 2FA'
    });
  }

  // Normal login flow if no 2FA
  // ...
})
```

#### 🎨 Frontend Implementation

**1. `website/admin/index.html`** - Sửa login handler:

```javascript
// Trong login success handler
if (data.requires2FA) {
  // Show 2FA input modal
  show2FAModal(data.tempToken);
} else {
  // Normal login flow
  redirect to dashboard
}
```

**2. `website/admin/setup-2fa.html`** (tạo mới)
```html
<!-- Page để admin setup 2FA -->
<!-- 1. Hiện QR code -->
<!-- 2. Input để verify TOTP -->
<!-- 3. Hiện backup codes sau khi enable -->
```

**3. Component: 2FA Modal**
```javascript
// Modal popup trong login page
function show2FAModal(tempToken) {
  // Show input for 6-digit code
  // On submit: POST /api/auth/2fa/verify
  // If success: redirect to dashboard
}
```

#### 🗃️ Database Changes

**Database schema đã sẵn sàng:**
```sql
-- Đã có trong schema
two_factor_enabled BOOLEAN DEFAULT FALSE,
two_factor_secret VARCHAR(255),
```

**Cần thêm table cho backup codes:**
```sql
CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### ⏱️ Estimated Time: 10-12 hours

---

### 2. 📱 Session Management UI

#### 📍 Vị Trí Bổ Sung

```
website/admin/
├── sessions.html                       # 🆕 Sessions management page
└── shared/
    └── ui.js                           # 📝 Thêm sessions UI functions

backend/routes/
└── auth.js                             # ✅ Endpoints đã có
```

#### 📝 Backend (Đã Có Sẵn)

Các endpoints này **đã được implement**:

```javascript
// ✅ Get user sessions
GET /api/auth/sessions

// ✅ Revoke specific session
DELETE /api/auth/sessions/:sessionId

// ✅ Logout from all devices
POST /api/auth/logout-all
```

#### 🎨 Frontend Cần Tạo

**1. `website/admin/sessions.html`** (tạo mới)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quản lý phiên đăng nhập - Admin HUTECH</title>
  <link rel="stylesheet" href="shared/style.css">
</head>
<body>
  <div class="admin-container">
    <h1>Phiên đăng nhập của bạn</h1>
    
    <div id="sessions-list">
      <!-- Dynamically loaded -->
    </div>
    
    <button onclick="logoutAll()">
      Đăng xuất khỏi tất cả thiết bị
    </button>
  </div>
  
  <script src="sessions.js"></script>
</body>
</html>
```

**2. `website/admin/sessions.js`** (tạo mới)

```javascript
async function loadSessions() {
  const response = await fetch(API + '/auth/sessions', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await response.json();
  
  renderSessions(data.data.sessions);
}

function renderSessions(sessions) {
  const html = sessions.map(s => `
    <div class="session-card ${s.is_current ? 'current' : ''}">
      <div class="session-icon">
        ${getDeviceIcon(s.device_info.userAgent)}
      </div>
      <div class="session-info">
        <h3>${getDeviceName(s.device_info.userAgent)}</h3>
        <p>IP: ${s.ip_address}</p>
        <p>Login: ${formatDate(s.created_at)}</p>
        <p>Expires: ${formatDate(s.expires_at)}</p>
      </div>
      ${s.is_current ? 
        '<span class="badge-current">Phiên hiện tại</span>' :
        `<button onclick="revokeSession(${s.id})">Đăng xuất</button>`
      }
    </div>
  `).join('');
  
  document.getElementById('sessions-list').innerHTML = html;
}

async function revokeSession(sessionId) {
  if (!confirm('Đăng xuất khỏi thiết bị này?')) return;
  
  await fetch(API + `/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  loadSessions(); // Reload
}

async function logoutAll() {
  if (!confirm('Đăng xuất khỏi TẤT CẢ thiết bị?')) return;
  
  await fetch(API + '/auth/logout-all', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  
  // Current session also revoked -> redirect to login
  window.location = 'index.html';
}
```

**3. Thêm link trong dashboard/menu:**

```html
<!-- website/admin/dashboard.html -->
<nav>
  <a href="sessions.html">
    <i class="fas fa-laptop"></i> Phiên đăng nhập
  </a>
</nav>
```

#### ⏱️ Estimated Time: 4-6 hours

---

### 3. 📊 Login Analytics Dashboard

#### 📍 Vị Trí Bổ Sung

```
backend/
├── routes/
│   └── analytics.js                    # 🆕 Analytics endpoints
├── services/
│   └── analyticsService.js             # 📝 Mở rộng (login analytics)
└── database/
    └── *-schema.sql                    # ✅ login_attempts table đã có

website/admin/
├── analytics.html                      # 🆕 Analytics dashboard page
└── assets/
    └── js/
        ├── chart.min.js                # 🆕 Chart.js library
        └── analytics.js                # 🆕 Analytics logic
```

#### 📦 Dependencies

```bash
# Backend (optional - for data processing)
npm install date-fns

# Frontend
# Use CDN for Chart.js
```

#### 📝 Backend Implementation

**1. `backend/routes/analytics.js`** (tạo mới)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get login statistics
router.get('/login-stats', authenticate, requireAdmin, async (req, res) => {
  const { period = '7d' } = req.query; // 7d, 30d, 90d
  
  // Total logins (success/fail)
  const totalStats = await db.query(`
    SELECT 
      success,
      COUNT(*) as count
    FROM login_attempts
    WHERE attempted_at >= NOW() - INTERVAL '${period}'
    GROUP BY success
  `);
  
  // Login attempts by day
  const dailyStats = await db.query(`
    SELECT 
      DATE(attempted_at) as date,
      SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = false THEN 1 ELSE 0 END) as failed
    FROM login_attempts
    WHERE attempted_at >= NOW() - INTERVAL '${period}'
    GROUP BY DATE(attempted_at)
    ORDER BY date
  `);
  
  // Failed login reasons
  const failureReasons = await db.query(`
    SELECT 
      failure_reason,
      COUNT(*) as count
    FROM login_attempts
    WHERE success = false AND attempted_at >= NOW() - INTERVAL '${period}'
    GROUP BY failure_reason
  `);
  
  // Top IPs with failed attempts
  const suspiciousIPs = await db.query(`
    SELECT 
      ip_address,
      COUNT(*) as failed_attempts
    FROM login_attempts
    WHERE success = false AND attempted_at >= NOW() - INTERVAL '${period}'
    GROUP BY ip_address
    HAVING COUNT(*) >= 5
    ORDER BY failed_attempts DESC
    LIMIT 10
  `);
  
  res.json({
    success: true,
    data: {
      total: totalStats,
      daily: dailyStats,
      failures: failureReasons,
      suspicious: suspiciousIPs
    }
  });
});

// Get active sessions count
router.get('/active-sessions', authenticate, requireAdmin, async (req, res) => {
  const count = await db.query(`
    SELECT COUNT(*) as count
    FROM user_sessions
    WHERE is_active = true AND expires_at > NOW()
  `);
  
  res.json({
    success: true,
    data: { count: count[0].count }
  });
});

module.exports = router;
```

**2. Thêm route vào `backend/server.js`:**

```javascript
app.use('/api/analytics', require('./routes/analytics'));
```

#### 🎨 Frontend Implementation

**1. `website/admin/analytics.html`** (tạo mới)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Analytics - Admin HUTECH</title>
  <link rel="stylesheet" href="shared/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
</head>
<body>
  <div class="admin-container">
    <h1>📊 Login Analytics</h1>
    
    <!-- Period selector -->
    <div class="period-selector">
      <button onclick="loadStats('7d')" class="active">7 ngày</button>
      <button onclick="loadStats('30d')">30 ngày</button>
      <button onclick="loadStats('90d')">90 ngày</button>
    </div>
    
    <!-- Stats cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Successful Logins</h3>
        <div id="success-count" class="stat-value">0</div>
      </div>
      <div class="stat-card">
        <h3>Failed Logins</h3>
        <div id="failed-count" class="stat-value">0</div>
      </div>
      <div class="stat-card">
        <h3>Active Sessions</h3>
        <div id="sessions-count" class="stat-value">0</div>
      </div>
    </div>
    
    <!-- Charts -->
    <div class="charts-grid">
      <div class="chart-container">
        <h3>Login Attempts Over Time</h3>
        <canvas id="loginChart"></canvas>
      </div>
      
      <div class="chart-container">
        <h3>Failure Reasons</h3>
        <canvas id="failureChart"></canvas>
      </div>
    </div>
    
    <!-- Suspicious IPs table -->
    <div class="table-container">
      <h3>🚨 Suspicious IP Addresses</h3>
      <table id="suspicious-ips-table">
        <!-- Dynamically loaded -->
      </table>
    </div>
  </div>
  
  <script src="assets/js/analytics.js"></script>
</body>
</html>
```

**2. `website/admin/assets/js/analytics.js`** (tạo mới)

```javascript
let loginChart, failureChart;

async function loadStats(period = '7d') {
  const token = localStorage.getItem('adm_tk');
  const response = await fetch(`${API_BASE}/analytics/login-stats?period=${period}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (data.success) {
    renderStats(data.data);
    renderCharts(data.data);
    renderSuspiciousIPs(data.data.suspicious);
  }
}

function renderStats(data) {
  const successCount = data.total.find(s => s.success)?.count || 0;
  const failedCount = data.total.find(s => !s.success)?.count || 0;
  
  document.getElementById('success-count').textContent = successCount;
  document.getElementById('failed-count').textContent = failedCount;
}

function renderCharts(data) {
  // Line chart: Login attempts over time
  const ctx1 = document.getElementById('loginChart').getContext('2d');
  if (loginChart) loginChart.destroy();
  
  loginChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: data.daily.map(d => d.date),
      datasets: [
        {
          label: 'Successful',
          data: data.daily.map(d => d.successful),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        },
        {
          label: 'Failed',
          data: data.daily.map(d => d.failed),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)'
        }
      ]
    }
  });
  
  // Pie chart: Failure reasons
  const ctx2 = document.getElementById('failureChart').getContext('2d');
  if (failureChart) failureChart.destroy();
  
  failureChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: data.failures.map(f => f.failure_reason),
      datasets: [{
        data: data.failures.map(f => f.count),
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)'
        ]
      }]
    }
  });
}

function renderSuspiciousIPs(ips) {
  const html = `
    <thead>
      <tr>
        <th>IP Address</th>
        <th>Failed Attempts</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      ${ips.map(ip => `
        <tr>
          <td>${ip.ip_address}</td>
          <td>${ip.failed_attempts}</td>
          <td><button onclick="blockIP('${ip.ip_address}')">Block</button></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  document.getElementById('suspicious-ips-table').innerHTML = html;
}

// Load on page load
loadStats('7d');
```

#### ⏱️ Estimated Time: 8-10 hours

---

## 📊 IMPLEMENTATION SUMMARY

### Priority 1 (Critical) - Total: 14-18 hours

| Feature | Time | Files to Create/Modify |
|---------|------|------------------------|
| Automated Tests | 6-8h | `tests/routes/`, `tests/middleware/`, `tests/integration/` |
| API Documentation | 2-3h | `config/swagger.js`, `docs/api/`, Postman collection |
| Password Reset | 6-8h | `routes/auth.js`, `forgot-password.html`, `reset-password.html`, templates |

### Priority 2 (Advanced) - Total: 22-28 hours

| Feature | Time | Files to Create/Modify |
|---------|------|------------------------|
| 2FA | 10-12h | `services/twoFactorService.js`, `setup-2fa.html`, auth routes |
| Session Management UI | 4-6h | `sessions.html`, `sessions.js` (backend đã có) |
| Login Analytics | 8-10h | `routes/analytics.js`, `analytics.html`, Chart.js integration |

**TOTAL ESTIMATED TIME:** 36-46 hours (4.5 - 6 working days)

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Week 1: Priority 1 Features
1. **Day 1-2:** Automated Tests (foundation)
2. **Day 3:** API Documentation
3. **Day 4-5:** Password Reset Flow

### Week 2: Priority 2 Features (Optional)
4. **Day 1-2:** Two-Factor Authentication
5. **Day 3:** Session Management UI
6. **Day 4-5:** Login Analytics Dashboard

---

## 📝 NOTES

### Về Dependencies

✅ **Đã có sẵn** trong `package.json`:
- `jest`, `supertest` (testing)
- `speakeasy`, `qrcode` (2FA)
- `swagger-jsdoc`, `swagger-ui-express` (API docs)

🆕 **Cần cài thêm** (optional):
- `date-fns` (date processing cho analytics)
- Chart.js (CDN, không cần npm install)

### Về Database

- ✅ Schema đã có columns cho 2FA: `two_factor_enabled`, `two_factor_secret`
- ✅ Table `login_attempts` đã có (cho analytics)
- 🆕 Cần tạo table `password_reset_tokens`
- 🆕 Cần tạo table `two_factor_backup_codes`

### Về Bảo Mật

Tất cả features này đều **tăng cường bảo mật** và được khuyến nghị cho production systems. Tuy nhiên:

- **Priority 1** là **critical** và nên làm sớm
- **Priority 2** là **nice-to-have** và có thể làm sau

---

**Last Updated:** 19/09/2026  
**Status:** Planning Complete - Ready for Implementation
