# 📁 DASHBOARD JAVASCRIPT MODULES

## 📋 MỤC LỤC

1. [Tổng quan](#tổng-quan)
2. [Cấu trúc files](#cấu-trúc-files)
3. [Chi tiết từng module](#chi-tiết-từng-module)
4. [Thứ tự load scripts](#thứ-tự-load-scripts)
5. [Dependencies](#dependencies)
6. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)

---

## 🎯 TỔNG QUAN

Dashboard JavaScript đã được tách thành 5 modules độc lập để dễ bảo trì và mở rộng:

```
dashboard/js/
├── dashboard-utils.js      # Utilities & helpers
├── dashboard-stats.js      # Stats & charts
├── dashboard-users.js      # User management
├── dashboard-settings.js   # Settings modal
└── dashboard-core.js       # Core & initialization
```

**Lợi ích:**
- ✅ Dễ maintain (mỗi file 100-200 dòng)
- ✅ Dễ debug (biết chính xác file nào có bug)
- ✅ Dễ mở rộng (thêm module mới không ảnh hưởng code cũ)
- ✅ Dễ làm việc nhóm (không conflict)
- ✅ Dễ test (test từng module riêng)

---

## 📂 CẤU TRÚC FILES

### 1. **dashboard-utils.js** (~120 dòng)
**Mục đích:** Các hàm tiện ích dùng chung

**Functions:**
- `formatCurrency(amount)` - Format số tiền VND
- `showNotification(message, type)` - Hiển thị toast notification
- `formatTimeAgo(date)` - Format thời gian "X phút trước"
- `debounce(func, wait)` - Debounce function
- `escapeHtml(text)` - Escape HTML để tránh XSS

**Sử dụng ở:**
- Tất cả các modules khác
- Có thể reuse cho các trang khác

---

### 2. **dashboard-stats.js** (~200 dòng)
**Mục đích:** Quản lý thống kê và biểu đồ

**Functions:**
- `loadStats()` - Load tất cả thống kê
- `updateStatsDisplay(stats)` - Cập nhật hiển thị stats
- `loadStatsIndividually()` - Load stats từng phần (fallback)
- `loadSystemStatus()` - Load trạng thái hệ thống
- `loadNotificationCount()` - Load số thông báo chưa đọc
- `initializeCharts()` - Khởi tạo Chart.js
- `loadDashboardData()` - Load tất cả dữ liệu dashboard

**Global Variables:**
- `charts` - Object chứa Chart.js instances

**Dependencies:**
- Chart.js library
- `formatCurrency()` từ dashboard-utils.js
- Auth object từ auth.js
- API_CONFIG từ api-config.js

---

### 3. **dashboard-users.js** (~180 dòng)
**Mục đích:** Quản lý người dùng

**Functions:**
- `loadUserList()` - Load danh sách người dùng
- `displayUserList(users)` - Hiển thị danh sách người dùng
- `filterUsers()` - Lọc người dùng theo search/role/status
- `toggleUserStatus(userId, newStatus)` - Bật/tắt trạng thái user
- `showAddUserForm()` - Hiển thị form thêm user (placeholder)
- `exportUsers()` - Xuất Excel (placeholder)

**Global Variables:**
- `allUsers` - Array chứa tất cả users

**Dependencies:**
- `escapeHtml()` từ dashboard-utils.js
- `showNotification()` từ dashboard-utils.js
- Auth object từ auth.js
- API_CONFIG từ api-config.js

---

### 4. **dashboard-settings.js** (~150 dòng)
**Mục đích:** Quản lý cài đặt dashboard

**Functions:**
- `showSettings()` - Hiển thị modal cài đặt
- `closeSettings()` - Đóng modal cài đặt
- `loadSettings()` - Load cài đặt từ localStorage
- `saveSettings()` - Lưu cài đặt vào localStorage
- `applySettings(settings)` - Áp dụng cài đặt
- `toggleDarkMode()` - Bật/tắt dark mode
- `changeLanguage()` - Đổi ngôn ngữ
- `showNotifications()` - Hiển thị thông báo (placeholder)

**LocalStorage Keys:**
- `dashboardSettings` - Object chứa tất cả settings

**Settings Structure:**
```javascript
{
    darkMode: boolean,
    language: 'vi' | 'en',
    emailNotif: boolean,
    browserNotif: boolean,
    soundNotif: boolean,
    twoFactor: boolean,
    onlineStatus: boolean,
    autoSave: boolean,
    itemsPerPage: '10' | '25' | '50' | '100'
}
```

**Dependencies:**
- `showNotification()` từ dashboard-utils.js

---

### 5. **dashboard-core.js** (~180 dòng)
**Mục đích:** Khởi tạo và quản lý core functions

**Functions:**
- `DOMContentLoaded event` - Khởi tạo dashboard
- `setupModalHandlers()` - Setup event handlers cho modal
- `showSection(sectionName)` - Chuyển đổi giữa các sections
- `loadUserInfo()` - Load thông tin user hiện tại
- `showAccessDenied()` - Hiển thị trang access denied
- `logout()` - Đăng xuất

**Global Variables:**
- `currentSection` - Section hiện tại đang hiển thị

**Dependencies:**
- Auth object từ auth.js
- `loadDashboardData()` từ dashboard-stats.js
- `initializeCharts()` từ dashboard-stats.js
- `loadUserList()` từ dashboard-users.js
- `applySettings()` từ dashboard-settings.js
- `closeSettings()` từ dashboard-settings.js

---

## 🔄 THỨ TỰ LOAD SCRIPTS

**QUAN TRỌNG:** Scripts phải được load theo đúng thứ tự trong `dashboard.html`:

```html
<!-- 1. Config Scripts (dependencies) -->
<script src="../../config/config.js"></script>
<script src="../../config/api-config.js"></script>
<script src="../../config/api-client.js"></script>
<script src="../../config/auth.js"></script>

<!-- 2. Dashboard Modules (theo thứ tự dependencies) -->
<script src="js/dashboard-utils.js"></script>      <!-- No dependencies -->
<script src="js/dashboard-stats.js"></script>      <!-- Depends on utils -->
<script src="js/dashboard-users.js"></script>      <!-- Depends on utils -->
<script src="js/dashboard-settings.js"></script>   <!-- Depends on utils -->
<script src="js/dashboard-core.js"></script>       <!-- Depends on all above -->
```

**Lý do:**
1. **Config scripts** phải load trước (Auth, API_CONFIG)
2. **dashboard-utils.js** phải load đầu tiên (không có dependencies)
3. **dashboard-stats.js, dashboard-users.js, dashboard-settings.js** có thể load song song (chỉ depend vào utils)
4. **dashboard-core.js** phải load cuối cùng (depend vào tất cả)

---

## 📦 DEPENDENCIES

### External Libraries:
- **Chart.js** - Biểu đồ (loaded từ CDN)
- **Font Awesome** - Icons (loaded từ CDN)

### Internal Dependencies:
```
dashboard-core.js
├── dashboard-utils.js
├── dashboard-stats.js
│   └── dashboard-utils.js
├── dashboard-users.js
│   └── dashboard-utils.js
├── dashboard-settings.js
│   └── dashboard-utils.js
└── config/
    ├── auth.js
    ├── api-config.js
    ├── api-client.js
    └── config.js
```

---

## 📖 HƯỚNG DẪN SỬ DỤNG

### Thêm function mới:

**1. Xác định module phù hợp:**
- Utility function → `dashboard-utils.js`
- Stats/Charts → `dashboard-stats.js`
- User management → `dashboard-users.js`
- Settings → `dashboard-settings.js`
- Core/Init → `dashboard-core.js`

**2. Thêm function vào file:**
```javascript
// dashboard-utils.js
function myNewUtility(param) {
    // Your code here
    return result;
}
```

**3. Export function (nếu cần):**
```javascript
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // ... existing exports
        myNewUtility
    };
}
```

---

### Sửa bug:

**1. Xác định module có bug:**
- Bug về stats/charts → `dashboard-stats.js`
- Bug về users → `dashboard-users.js`
- Bug về settings → `dashboard-settings.js`
- Bug về init/routing → `dashboard-core.js`
- Bug về utilities → `dashboard-utils.js`

**2. Mở file và sửa:**
```javascript
// Trước
function buggyFunction() {
    // Bug here
}

// Sau
function buggyFunction() {
    // Fixed code
}
```

**3. Test:**
- Reload trang
- Test chức năng đã sửa
- Check console không có errors

---

### Thêm module mới:

**1. Tạo file mới:**
```javascript
// dashboard/js/dashboard-new-feature.js
/**
 * ============================================
 * DASHBOARD NEW FEATURE MODULE
 * ============================================
 */

function newFeatureFunction() {
    // Your code
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        newFeatureFunction
    };
}
```

**2. Thêm vào dashboard.html:**
```html
<script src="js/dashboard-new-feature.js"></script>
```

**3. Sử dụng:**
```javascript
// Trong dashboard-core.js hoặc file khác
newFeatureFunction();
```

---

## 🧪 TESTING

### Test từng module:

**1. Test utils:**
```javascript
// Console
formatCurrency(1000000); // "1.000.000 ₫"
showNotification('Test', 'success'); // Hiển thị notification
```

**2. Test stats:**
```javascript
// Console
loadStats(); // Load stats
loadSystemStatus(); // Load system status
```

**3. Test users:**
```javascript
// Console
loadUserList(); // Load users
filterUsers(); // Filter users
```

**4. Test settings:**
```javascript
// Console
showSettings(); // Mở modal
saveSettings(); // Lưu settings
```

---

## 🔧 TROUBLESHOOTING

### Lỗi thường gặp:

**1. "Function is not defined"**
- **Nguyên nhân:** Script load sai thứ tự
- **Giải pháp:** Check thứ tự scripts trong dashboard.html

**2. "Cannot read property of undefined"**
- **Nguyên nhân:** Dependency chưa load
- **Giải pháp:** Đảm bảo config scripts load trước

**3. "Chart is not defined"**
- **Nguyên nhân:** Chart.js chưa load
- **Giải pháp:** Check CDN link Chart.js

**4. "Auth is not defined"**
- **Nguyên nhân:** auth.js chưa load
- **Giải pháp:** Check script tag auth.js

---

## 📊 THỐNG KÊ

### Trước khi tách:
- **1 file:** dashboard.html (870 dòng)
- **Khó maintain:** Phải scroll qua 870 dòng
- **Khó debug:** Không biết bug ở đâu
- **Khó mở rộng:** Thêm code vào cuối file

### Sau khi tách:
- **5 files:** Mỗi file 100-200 dòng
- **Dễ maintain:** Biết chính xác file nào cần sửa
- **Dễ debug:** Tìm bug nhanh hơn
- **Dễ mở rộng:** Thêm module mới không ảnh hưởng code cũ

---

## 🎓 BEST PRACTICES

1. **Single Responsibility:** Mỗi file 1 nhiệm vụ
2. **DRY:** Don't Repeat Yourself - Dùng utils cho code chung
3. **Naming:** Tên function rõ ràng, dễ hiểu
4. **Comments:** Comment cho functions phức tạp
5. **Error Handling:** Luôn có try-catch cho async functions
6. **Console Logs:** Log để debug, nhưng xóa khi production

---

## 📝 CHANGELOG

### Version 1.0.0 (2025-02-08)
- ✅ Tách JavaScript từ dashboard.html
- ✅ Tạo 5 modules: utils, stats, users, settings, core
- ✅ Document đầy đủ
- ✅ Test tất cả functions

---

## 👥 MAINTAINERS

- **Dashboard Core:** dashboard-core.js
- **Stats & Charts:** dashboard-stats.js
- **User Management:** dashboard-users.js
- **Settings:** dashboard-settings.js
- **Utilities:** dashboard-utils.js

---

## 📞 SUPPORT

Nếu có vấn đề:
1. Check console errors
2. Check thứ tự load scripts
3. Check dependencies
4. Check file README.md này

---

**Happy Coding! 🚀**
