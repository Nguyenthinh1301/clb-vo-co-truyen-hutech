# Hướng dẫn cài đặt đăng nhập bằng Google và Facebook

## Đăng nhập bằng Google

### 1. Tạo Google Cloud Project
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project hiện có
3. Bật Google+ API trong Libraries

### 2. Tạo OAuth 2.0 Credentials
1. Vào "Credentials" → "Create Credentials" → "OAuth client ID"
2. Chọn "Web application"
3. Thêm domain của bạn vào "Authorized JavaScript origins":
   - `http://localhost:8000` (cho development)
   - `https://yourdomain.com` (cho production)
4. Thêm redirect URIs vào "Authorized redirect URIs":
   - `http://localhost:8000/views/account/dang-nhap.html`
   - `https://yourdomain.com/views/account/dang-nhap.html`

### 3. Cập nhật Client ID
Trong file `dang-nhap.html` và `dang-ky.html`, thay thế:
```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```
bằng Client ID thực tế của bạn.

## Đăng nhập bằng Facebook

### 1. Tạo Facebook App
1. Truy cập [Facebook Developers](https://developers.facebook.com/)
2. Tạo một App mới
3. Chọn "Consumer" → "Add Facebook Login"

### 2. Cấu hình Facebook Login
1. Vào App Settings → Basic
2. Thêm App Domain: `yourdomain.com`
3. Vào Facebook Login → Settings
4. Thêm Valid OAuth Redirect URIs:
   - `http://localhost:8000/views/account/dang-nhap.html`
   - `https://yourdomain.com/views/account/dang-nhap.html`

### 3. Cập nhật App ID
Trong file `dang-nhap.html` và `dang-ky.html`, thay thế:
```javascript
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';
```
bằng App ID thực tế của bạn.

## Demo Mode

Khi chưa cài đặt OAuth, hệ thống sẽ chạy ở chế độ demo:
- Đăng nhập Google demo: `demo.google@gmail.com`
- Đăng nhập Facebook demo: `demo.facebook@fb.com`
- Đăng ký sẽ tạo tài khoản demo với avatar mặc định

## Bảo mật

### Quan trọng:
1. Không commit Client ID/App ID vào git public
2. Sử dụng environment variables cho production
3. Thiết lập CORS properly
4. Validate tokens ở server-side
5. Sử dụng HTTPS cho production

## Test chức năng

1. Mở website: `http://localhost:8000`
2. Vào trang đăng nhập
3. Thử đăng nhập/đăng ký bằng:
   - Email thường
   - Google (demo hoặc thực tế)
   - Facebook (demo hoặc thực tế)
4. Kiểm tra avatar và thông tin trong dashboard

## Troubleshooting

### Lỗi thường gặp:
1. **"Invalid domain"**: Kiểm tra authorized domains
2. **"Access blocked"**: Kiểm tra redirect URIs
3. **"App not approved"**: Submit app for review (Facebook)
4. **CORS errors**: Kiểm tra domain settings

### Debug:
- Mở Developer Tools → Console để xem lỗi
- Kiểm tra Network tab để xem API calls
- Verify OAuth settings trong console

## Production Deployment

1. Update domain settings trong OAuth consoles
2. Set environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your_actual_client_id
   FACEBOOK_APP_ID=your_actual_app_id
   ```
3. Cập nhật JavaScript để đọc từ environment
4. Enable HTTPS
5. Test thoroughly trước khi launch
