# 📝 Hướng Dẫn Đăng Ký Tài Khoản

## ⚠️ YÊU CẦU MẬT KHẨU QUAN TRỌNG

Hệ thống có yêu cầu bảo mật nghiêm ngặt cho mật khẩu. Mật khẩu phải đáp ứng TẤT CẢ các điều kiện sau:

### ✅ Yêu cầu bắt buộc:
1. **Tối thiểu 8 ký tự**
2. **Phải có ít nhất 1 chữ HOA** (A-Z)
3. **Phải có ít nhất 1 chữ thường** (a-z)
4. **Phải có ít nhất 1 chữ số** (0-9)

### ✅ Ví dụ mật khẩu HỢP LỆ:
- `Password123`
- `MyPass456`
- `Test1234`
- `VoCo2024`
- `Hutech123`

### ❌ Ví dụ mật khẩu KHÔNG HỢP LỆ:
- `password123` ❌ (thiếu chữ HOA)
- `PASSWORD123` ❌ (thiếu chữ thường)
- `Password` ❌ (thiếu chữ số)
- `Pass123` ❌ (quá ngắn, dưới 8 ký tự)
- `12345678` ❌ (chỉ có số, thiếu chữ)

## 🔧 CÁCH KHẮC PHỤC LỖI "Đăng ký không thành công"

### Bước 1: Kiểm tra Backend đang chạy
```bash
# Mở terminal trong thư mục backend
cd backend
npm start
```

Đợi đến khi thấy thông báo:
```
✅ Server is running on port 3000
✅ SQL Server connection pool created successfully
```

### Bước 2: Kiểm tra kết nối Backend
Mở file `TEST_REGISTRATION.html` trong trình duyệt và click nút "Kiểm tra Backend"

Nếu thấy ✅ "Backend đang chạy tốt!" → Tiếp tục bước 3
Nếu thấy ❌ "Không thể kết nối" → Quay lại bước 1

### Bước 3: Test đăng ký với mật khẩu hợp lệ
Trong file `TEST_REGISTRATION.html`, click "Test 1: Đăng ký với mật khẩu hợp lệ"

Nếu thấy ✅ "THÀNH CÔNG!" → Hệ thống hoạt động tốt
Nếu thấy ❌ "THẤT BẠI!" → Xem chi tiết lỗi và báo lại

### Bước 4: Đăng ký tài khoản thật
1. Mở trang đăng ký: `website/views/account/dang-ky.html`
2. Điền đầy đủ thông tin
3. **QUAN TRỌNG**: Nhập mật khẩu đáp ứng yêu cầu (ví dụ: `MyPass123`)
4. Xác nhận lại mật khẩu giống hệt
5. Click "Đăng ký ngay"

## 🎯 CẢI TIẾN ĐÃ THỰC HIỆN

### 1. Hiển thị yêu cầu mật khẩu rõ ràng
- Thêm gợi ý ngay dưới ô nhập mật khẩu
- Hiển thị: "Tối thiểu 8 ký tự, bao gồm chữ HOA, chữ thường và số"

### 2. Thông báo lỗi chi tiết hơn
- Khi backend trả về lỗi validation, hiển thị từng lỗi cụ thể
- Ví dụ: "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số"

### 3. Xử lý lỗi mạng tốt hơn
- Phân biệt rõ lỗi validation và lỗi kết nối
- Hướng dẫn khắc phục chi tiết khi không kết nối được backend

## 📋 THÔNG TIN ĐĂNG NHẬP ADMIN

Sau khi đăng ký thành công, bạn có thể đăng nhập với:

**Tài khoản Admin:**
- Email: `admin@test.com`
- Password: `admin123`

**Tài khoản User mới đăng ký:**
- Email: Email bạn đã đăng ký
- Password: Mật khẩu bạn đã tạo (phải đáp ứng yêu cầu)

## 🐛 TROUBLESHOOTING

### Lỗi: "Backend không hoạt động"
**Nguyên nhân:** Backend chưa chạy hoặc đã bị dừng
**Giải pháp:** 
```bash
cd backend
npm start
```

### Lỗi: "Mật khẩu phải có ít nhất 8 ký tự..."
**Nguyên nhân:** Mật khẩu không đáp ứng yêu cầu bảo mật
**Giải pháp:** Đổi mật khẩu theo yêu cầu (ví dụ: `MyPass123`)

### Lỗi: "Email đã được sử dụng"
**Nguyên nhân:** Email này đã có trong database
**Giải pháp:** Sử dụng email khác hoặc đăng nhập với email này

### Lỗi: "Username đã được sử dụng"
**Nguyên nhân:** Hệ thống tự tạo username từ email, email đã tồn tại
**Giải pháp:** Sử dụng email khác

## 📁 FILES LIÊN QUAN

- `website/views/account/dang-ky.html` - Trang đăng ký
- `website/config/auth.js` - Xử lý authentication
- `backend/routes/auth.js` - API đăng ký backend
- `backend/middleware/validation.js` - Validation rules
- `TEST_REGISTRATION.html` - Tool test đăng ký

## 🔄 HARD REFRESH

Sau khi cập nhật code, nhớ hard refresh trình duyệt:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

## ✅ CHECKLIST ĐĂNG KÝ THÀNH CÔNG

- [ ] Backend đang chạy (npm start)
- [ ] Đã test kết nối backend (TEST_REGISTRATION.html)
- [ ] Mật khẩu có ít nhất 8 ký tự
- [ ] Mật khẩu có chữ HOA
- [ ] Mật khẩu có chữ thường
- [ ] Mật khẩu có chữ số
- [ ] Xác nhận mật khẩu khớp
- [ ] Email chưa được sử dụng
- [ ] Đã điền đầy đủ thông tin bắt buộc (*)
- [ ] Đã đồng ý điều khoản sử dụng

---

**Lưu ý:** Nếu vẫn gặp vấn đề sau khi làm theo hướng dẫn, vui lòng:
1. Chụp màn hình lỗi
2. Kiểm tra Console (F12) xem có lỗi gì
3. Kiểm tra terminal backend xem có lỗi gì
4. Báo lại với đầy đủ thông tin trên
