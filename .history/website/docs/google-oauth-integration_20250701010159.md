# Hướng dẫn tích hợp Google OAuth 2.0

## Bước 1: Thiết lập Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project mới hoặc chọn project hiện có
3. Trong menu bên trái, chọn "APIs & Services" > "Credentials"
4. Click "CREATE CREDENTIALS" > "OAuth client ID"
5. Chọn "Web application"
6. Thêm domain của bạn vào "Authorized JavaScript origins"
7. Thêm redirect URI vào "Authorized redirect URIs"

## Bước 2: Thêm Google Identity Services

Thêm script này vào `<head>` của trang HTML:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

## Bước 3: Cập nhật HTML

Thay thế nút Google demo bằng:

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-context="signin"
     data-ux_mode="popup"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false">
</div>

<div class="g_id_signin"
     data-type="standard"
     data-shape="rectangular"
     data-theme="outline"
     data-text="signin_with"
     data-size="large"
     data-logo_alignment="left">
</div>
```

## Bước 4: Xử lý phản hồi

```javascript
function handleCredentialResponse(response) {
    // Decode JWT token
    const responsePayload = decodeJwtResponse(response.credential);
    
    const userData = {
        email: responsePayload.email,
        name: responsePayload.name,
        avatar: responsePayload.picture,
        role: 'member',
        loginType: 'google',
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(userData));
    window.location.href = 'dashboard.html';
}

function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
```

## Bước 5: Thiết lập bảo mật

1. Chỉ cho phép domain chính thức trong Google Console
2. Sử dụng HTTPS cho production
3. Validate token ở backend nếu có
4. Thiết lập proper CORS headers

## Lưu ý quan trọng

- File hiện tại đang sử dụng demo version
- Cần có SSL certificate cho production
- Token có thời hạn, cần xử lý refresh
- Nên validate thông tin user ở backend
