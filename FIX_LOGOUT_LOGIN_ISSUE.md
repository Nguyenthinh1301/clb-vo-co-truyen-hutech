# 🔧 Khắc Phục Lỗi Đăng Xuất & Đăng Nhập Lại

## 📋 VẤN ĐỀ

**Triệu chứng:** Sau khi đăng xuất, không thể đăng nhập lại được

**Nguyên nhân có thể:**
1. LocalStorage không được xóa sạch sau khi logout
2. Token cũ vẫn còn và gây xung đột
3. Trang đăng nhập tự động redirect khi phát hiện token cũ (không hợp lệ)
4. Session backend không được revoke đúng cách

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. Cải thiện function `clearAuth()` (auth.js)

**Trước:**
```javascript
clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    this.token = null;
    this.currentUser = null;
}
```

**Sau:**
```javascript
clearAuth() {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('demoInfoShown'); // Reset demo info
    
    // Clear instance variables
    this.token = null;
    this.currentUser = null;
    
    console.log('Auth data cleared successfully');
}
```

**Lợi ích:** Xóa sạch TẤT CẢ dữ liệu liên quan đến authentication

### 2. Cải thiện function `logout()` (auth.js)

**Trước:**
```javascript
async logout() {
    try {
        await this.authAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        this.clearAuth();
        window.location.href = '/website/views/account/dang-nhap.html';
    }
}
```

**Sau:**
```javascript
async logout() {
    try {
        // Call backend logout API if token exists
        if (this.token) {
            await this.authAPI.logout();
        }
    } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API fails
    } finally {
        // Always clear local auth data
        this.clearAuth();
        
        // Force reload to clear any cached state
        window.location.replace('/website/views/account/dang-nhap.html');
    }
}
```

**Lợi ích:** 
- Sử dụng `window.location.replace()` thay vì `href` để force reload
- Logout local ngay cả khi backend API fail
- Xóa cached state

### 3. Thêm token verification (dang-nhap.html)

**Trước:**
```javascript
function checkExistingLogin() {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (currentUser && authToken) {
        try {
            const userData = JSON.parse(currentUser);
            redirectAfterLogin(userData);
            return true;
        } catch (error) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
        }
    }
    return false;
}
```

**Sau:**
```javascript
async function checkExistingLogin() {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (currentUser && authToken) {
        try {
            const userData = JSON.parse(currentUser);
            
            // Verify token with backend before redirecting
            console.log('Found existing session, verifying with backend...');
            
            const verifyResult = await Auth.authAPI.verify();
            
            if (verifyResult && verifyResult.success) {
                console.log('Token is valid, redirecting...');
                redirectAfterLogin(userData);
                return true;
            } else {
                console.log('Token is invalid, clearing auth data...');
                // Token is invalid, clear it
                Auth.clearAuth();
            }
        } catch (error) {
            console.error('Error verifying token:', error);
            // Clear invalid data
            Auth.clearAuth();
        }
    }
    return false;
}
```

**Lợi ích:** 
- Verify token với backend trước khi redirect
- Tự động xóa token không hợp lệ
- Tránh redirect loop

### 4. Thêm endpoint VERIFY (api-config.js)

```javascript
AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY: '/api/auth/verify',  // ← MỚI THÊM
    // ...
}
```

### 5. Thêm method verify() (api-client.js)

```javascript
// Verify token (check if current token is valid)
async verify() {
    return this.api.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY);
}
```

## 🧪 CÁCH TEST

### Bước 1: Mở file test
Mở `TEST_LOGOUT_LOGIN.html` trong trình duyệt

### Bước 2: Chạy các test theo thứ tự

1. **Test 1: Kiểm tra trạng thái** - Xem có đang đăng nhập không
2. **Test 2: Đăng nhập** - Đăng nhập với admin@test.com
3. **Test 3: Verify token** - Kiểm tra token có hợp lệ không
4. **Test 4: Đăng xuất** - Logout và xóa dữ liệu
5. **Test 5: Kiểm tra sau logout** - Xác nhận localStorage đã sạch
6. **Test 6: Đăng nhập lại** - Thử đăng nhập lại

### Kết quả mong đợi:

```
Test 1: ⚠️ CHƯA ĐĂNG NHẬP (nếu chưa login)
Test 2: ✅ ĐĂNG NHẬP THÀNH CÔNG
Test 3: ✅ TOKEN HỢP LỆ
Test 4: ✅ ĐĂNG XUẤT THÀNH CÔNG
Test 5: ✅ HOÀN HẢO! (localStorage sạch)
Test 6: ✅ ĐĂNG NHẬP LẠI THÀNH CÔNG
```

## 🔍 TROUBLESHOOTING

### Vấn đề 1: Sau logout vẫn còn token trong localStorage

**Kiểm tra:**
```javascript
// Mở Console (F12) và chạy:
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('currentUser'));
```

**Giải pháp:**
```javascript
// Xóa thủ công:
localStorage.clear();
// Hoặc
Auth.clearAuth();
```

### Vấn đề 2: Trang đăng nhập tự động redirect về dashboard

**Nguyên nhân:** Token cũ vẫn còn và trang nghĩ là đã đăng nhập

**Giải pháp:**
1. Hard refresh: `Ctrl + Shift + R`
2. Xóa localStorage: `localStorage.clear()`
3. Kiểm tra Console xem có lỗi verify token không

### Vấn đề 3: Backend trả về 401 khi đăng nhập lại

**Kiểm tra backend logs:**
```bash
# Trong terminal backend
POST /api/auth/login 401 ... ms
```

**Nguyên nhân có thể:**
- Mật khẩu sai
- Email không tồn tại
- Session cũ chưa được revoke

**Giải pháp:**
1. Kiểm tra email/password đúng chưa
2. Restart backend: `npm start`
3. Kiểm tra database có user không

### Vấn đề 4: Lỗi "Token is invalid" ngay sau khi đăng nhập

**Nguyên nhân:** Backend không tạo token đúng cách

**Kiểm tra:**
```javascript
// Console
const result = await Auth.login('admin@test.com', 'admin123');
console.log(result);
// Phải có: result.success = true, result.user, và token được lưu
```

## 📊 FLOW ĐÚNG

### Đăng nhập:
```
1. User nhập email/password
2. Frontend gọi Auth.login()
3. Backend verify credentials
4. Backend tạo token + session
5. Frontend lưu token + user vào localStorage
6. Redirect đến dashboard
```

### Đăng xuất:
```
1. User click logout
2. Frontend gọi Auth.logout()
3. Backend revoke session
4. Frontend xóa localStorage (clearAuth)
5. Redirect đến trang đăng nhập (replace)
6. Trang đăng nhập verify token (không có → OK)
```

### Đăng nhập lại:
```
1. User vào trang đăng nhập
2. checkExistingLogin() → không có token → OK
3. User nhập email/password
4. Đăng nhập bình thường như lần đầu
```

## ✅ CHECKLIST KHẮC PHỤC

- [x] Cải thiện clearAuth() để xóa tất cả dữ liệu
- [x] Sử dụng window.location.replace() thay vì href
- [x] Thêm token verification trước khi redirect
- [x] Thêm endpoint /api/auth/verify
- [x] Thêm method verify() trong AuthAPI
- [x] Tạo tool test logout/login flow
- [x] Viết tài liệu troubleshooting

## 🎯 KẾT QUẢ

Sau khi áp dụng các fix trên:
- ✅ Logout xóa sạch localStorage
- ✅ Không còn redirect loop
- ✅ Có thể đăng nhập lại bình thường
- ✅ Token được verify trước khi sử dụng
- ✅ Session backend được quản lý đúng cách

## 📁 FILES LIÊN QUAN

- `website/config/auth.js` - AuthManager class
- `website/config/api-config.js` - API endpoints
- `website/config/api-client.js` - AuthAPI class
- `website/views/account/dang-nhap.html` - Login page
- `backend/routes/auth.js` - Backend auth routes
- `TEST_LOGOUT_LOGIN.html` - Test tool

## 🔄 HARD REFRESH

Sau khi cập nhật code, nhớ hard refresh:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

---

**Lưu ý:** Nếu vẫn gặp vấn đề, hãy:
1. Mở `TEST_LOGOUT_LOGIN.html` và chạy từng test
2. Chụp màn hình kết quả
3. Kiểm tra Console (F12) xem có lỗi gì
4. Kiểm tra backend logs
5. Báo lại với đầy đủ thông tin
