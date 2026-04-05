# 🔧 FIX ĐƯỜNG DẪN ĐĂNG XUẤT USER

## ❌ VẤN ĐỀ

Khi user đăng xuất từ dashboard, bị redirect sai đường dẫn:

```
❌ /views/account/dang-nhap.html  (thiếu /website/)
❌ dang-nhap.html  (relative path sai)
```

Dẫn đến lỗi: **Cannot GET /views/account/dang-nhap.html**

---

## ✅ GIẢI PHÁP ĐÃ THỰC HIỆN

### Fix 1: Auth.logout() trong auth.js

**File:** `website/config/auth.js`

**Trước:**
```javascript
async logout() {
    try {
        await this.authAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        this.clearAuth();
        window.location.href = '/views/account/dang-nhap.html';  // ❌ Thiếu /website/
    }
}
```

**Sau:**
```javascript
async logout() {
    try {
        await this.authAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        this.clearAuth();
        window.location.href = '/website/views/account/dang-nhap.html';  // ✅ Đúng
    }
}
```

---

### Fix 2: logout() trong dashboard-core.js

**File:** `dashboard/js/dashboard-core.js`

**Trước:**
```javascript
async function logout() {
    try {
        await Auth.logout();
        window.location.href = 'dang-nhap.html';  // ❌ Relative path sai
    } catch (error) {
        console.error('Logout error:', error);
        Auth.clearAuth();
        window.location.href = 'dang-nhap.html';  // ❌ Relative path sai
    }
}
```

**Sau:**
```javascript
async function logout() {
    try {
        await Auth.logout();
        // Auth.logout() already handles redirect, but add fallback
        window.location.href = '/website/views/account/dang-nhap.html';  // ✅ Đúng
    } catch (error) {
        console.error('Logout error:', error);
        Auth.clearAuth();
        window.location.href = '/website/views/account/dang-nhap.html';  // ✅ Đúng
    }
}
```

---

## 🔍 CÁC NƠI SỬ DỤNG LOGOUT

### 1. User Dashboard
**File:** `dashboard/user-dashboard.html`

```html
<div class="sidebar-footer">
    <a href="#" class="nav-tab" onclick="Auth.logout()">
        <i class="fas fa-sign-out-alt"></i>
        <span>Đăng xuất</span>
    </a>
</div>
```

**Status:** ✅ Đúng - Gọi `Auth.logout()` đã được fix

---

### 2. Admin Dashboard
**File:** `dashboard/dashboard.html`

Sử dụng `logout()` function từ `dashboard-core.js`

**Status:** ✅ Đúng - Function đã được fix

---

### 3. Header Component
**File:** `website/components/header.html`

```javascript
async function logout() {
    try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        showGuestMenu();
        alert('Đăng xuất thành công!');
        window.location.reload();  // ✅ Reload current page
    } catch (error) {
        console.error('Logout error:', error);
    }
}
```

**Status:** ✅ OK - Reload trang hiện tại, không redirect

---

## 📊 LOGOUT FLOW

### Flow 1: Từ User Dashboard

```
User Dashboard
    ↓
Click "Đăng xuất"
    ↓
Auth.logout() called
    ↓
Clear localStorage
    ↓
Redirect to: /website/views/account/dang-nhap.html ✅
```

### Flow 2: Từ Admin Dashboard

```
Admin Dashboard
    ↓
Click "Đăng xuất"
    ↓
logout() from dashboard-core.js
    ↓
Auth.logout() called
    ↓
Clear localStorage
    ↓
Redirect to: /website/views/account/dang-nhap.html ✅
```

### Flow 3: Từ Website Header

```
Website (any page)
    ↓
Click "Đăng xuất" in header
    ↓
logout() from header.html
    ↓
Clear localStorage
    ↓
Reload current page ✅
```

---

## 🧪 TEST LOGOUT

### Test 1: User Dashboard Logout

1. Đăng nhập với: `member@hutech.edu.vn` / `member123`
2. Vào User Dashboard: `http://localhost:3000/dashboard/user-dashboard.html`
3. Click "Đăng xuất" ở sidebar
4. **Expected:** Redirect đến `http://localhost:3000/website/views/account/dang-nhap.html`
5. **Result:** ✅ PASS

### Test 2: Admin Dashboard Logout

1. Đăng nhập với: `admin@hutech.edu.vn` / `admin123`
2. Vào Admin Dashboard: `http://localhost:3000/dashboard/dashboard.html`
3. Click "Đăng xuất"
4. **Expected:** Redirect đến `http://localhost:3000/website/views/account/dang-nhap.html`
5. **Result:** ✅ PASS

### Test 3: Website Header Logout

1. Đăng nhập và ở trang chủ: `http://localhost:3000/website/index.html`
2. Click "Đăng xuất" trong header menu
3. **Expected:** Reload trang chủ, hiển thị guest menu
4. **Result:** ✅ PASS

---

## 🔧 TROUBLESHOOTING

### Lỗi: Cannot GET /views/account/dang-nhap.html

**Nguyên nhân:** Đường dẫn thiếu `/website/`

**Giải pháp:** Đã fix trong `auth.js` và `dashboard-core.js`

### Lỗi: Cannot GET /dang-nhap.html

**Nguyên nhân:** Sử dụng relative path sai

**Giải pháp:** Đã fix, dùng absolute path `/website/views/account/dang-nhap.html`

### Lỗi: Logout không clear localStorage

**Nguyên nhân:** Function `clearAuth()` không được gọi

**Giải pháp:** Đã có trong `Auth.logout()`:
```javascript
this.clearAuth();  // Clears token and user data
```

---

## 📋 CHECKLIST

### Files Đã Fix:
- [x] `website/config/auth.js` - Auth.logout() redirect path
- [x] `dashboard/js/dashboard-core.js` - logout() redirect path

### Logout Buttons Verified:
- [x] User Dashboard sidebar footer
- [x] Admin Dashboard (uses dashboard-core.js)
- [x] Website header component

### Test Cases:
- [x] User logout from dashboard
- [x] Admin logout from dashboard
- [x] Logout from website header
- [x] Verify localStorage cleared
- [x] Verify redirect to correct login page

---

## 🎯 ĐƯỜNG DẪN ĐÚNG SAU KHI LOGOUT

### Từ Dashboard (User/Admin):
```
✅ http://localhost:3000/website/views/account/dang-nhap.html
```

### Từ Website:
```
✅ Reload current page (stay on website)
```

---

## 💡 BEST PRACTICES

### 1. Sử dụng Absolute Paths
```javascript
// ✅ Good
window.location.href = '/website/views/account/dang-nhap.html';

// ❌ Bad
window.location.href = 'dang-nhap.html';
window.location.href = '../views/account/dang-nhap.html';
```

### 2. Centralize Logout Logic
```javascript
// Tất cả logout đều gọi Auth.logout()
Auth.logout();  // Handles everything: clear data + redirect
```

### 3. Always Clear Auth Data
```javascript
async logout() {
    // Clear all auth data
    this.clearAuth();
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    
    // Then redirect
    window.location.href = '/website/views/account/dang-nhap.html';
}
```

---

## ✅ KẾT LUẬN

Đường dẫn đăng xuất đã được fix hoàn toàn:

1. ✅ `Auth.logout()` redirect đúng đến `/website/views/account/dang-nhap.html`
2. ✅ `dashboard-core.js logout()` redirect đúng
3. ✅ Tất cả logout buttons hoạt động chính xác
4. ✅ localStorage được clear đúng cách
5. ✅ Không còn lỗi "Cannot GET"

**User giờ có thể đăng xuất an toàn từ bất kỳ đâu!**
