# 📁 Demo Files

Folder này chứa tất cả các file demo của dự án CLB Võ Cổ Truyền HUTECH.

## 📂 Cấu trúc

### Demo Pages (6 files)
- `index.html` - Trang demo chính
- `dang-nhap.html` - Demo trang đăng nhập
- `dang-ky.html` - Demo trang đăng ký
- `demo-gallery.html` - Demo gallery/thư viện ảnh
- `demo-coaches.html` - Demo trang huấn luyện viên
- `api-demo.html` - Demo API testing

### Scripts & Styles (3 files)
- `demo-script.js` - JavaScript cho demo
- `demo-styles.css` - CSS cho demo
- `demo-data.js` - Dữ liệu demo

### Navigation
- `index-demo.html` - Trang index để truy cập tất cả demo

## 🎯 Mục đích

Các file trong folder này được sử dụng để:
- ✅ Demo giao diện cho khách hàng
- ✅ Showcase các tính năng
- ✅ Prototype nhanh
- ✅ Presentation và review

**Lưu ý:** Các file test đã được chuyển sang folder `../test/`

## 🚀 Cách sử dụng

### Truy cập demo index:
```bash
# Mở trang index demo
open demo/index-demo.html

# Hoặc sử dụng Live Server
npx http-server -p 8080
```

### Xem từng demo:
1. Mở `index-demo.html` trong trình duyệt
2. Chọn demo muốn xem
3. Click để mở trong tab mới

### Test API:
1. Mở `api-demo.html` trong trình duyệt
2. Đảm bảo backend đang chạy (http://localhost:3000)
3. Test các API endpoints

## 🔗 Liên kết

- **Website chính:** `../website/index.html`
- **Test files:** `../test/index-test.html`
- **Backend API:** `http://localhost:3000`
- **API Docs:** `http://localhost:3000/api-docs`

## 📊 Danh sách file

### Demo Pages (6 files)
1. index.html - Demo homepage
2. dang-nhap.html - Demo login page
3. dang-ky.html - Demo register page
4. demo-gallery.html - Demo gallery
5. demo-coaches.html - Demo coaches page
6. api-demo.html - API testing page

### Scripts & Styles (3 files)
7. demo-script.js - Demo JavaScript
8. demo-styles.css - Demo CSS
9. demo-data.js - Mock data

### Navigation (1 file)
10. index-demo.html - Demo index page

**Total: 10 files**

---

**Lưu ý:** Folder này chỉ chứa demo files. Test files đã được chuyển sang `../test/`

## 🧹 Dọn dẹp

Để xóa tất cả file demo/test khi chuẩn bị production:
```bash
# Xóa toàn bộ folder demo
rm -rf demo

# Hoặc trên Windows
rmdir /s /q demo
```

---

**Lưu ý:** Folder này được tạo tự động để tổ chức các file demo và test. Không commit vào production repository.
