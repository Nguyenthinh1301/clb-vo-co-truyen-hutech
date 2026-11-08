# Hướng dẫn trang quản trị

Địa chỉ: **https://vocotruyenhutech.netlify.app/admin/** — chỉ tài khoản có vai trò **Admin** đăng nhập được.

## Đăng nhập

- Lần truy cập đầu trong ngày có thể thấy *"Máy chủ đang khởi động…"* (khoảng 1 phút) — cứ đợi, trang tự thử lại.
- Nút 👁 để xem mật khẩu vừa gõ; trang cảnh báo khi đang bật Caps Lock.
- Sai mật khẩu quá **20 lần / 15 phút** sẽ bị chặn tạm — đợi 15 phút.
- Nên lưu mật khẩu trong trình quản lý mật khẩu (Chrome, Edge, Bitwarden) — trang hỗ trợ tự điền.

## Các mục quản lý

| Mục | Làm được gì | Hiển thị ở website |
|---|---|---|
| **Dashboard** | Số liệu tổng quan; thẻ *Liên hệ* viền đỏ khi có tin nhắn chưa đọc; tin tức & sự kiện gần đây | — |
| **Tin tức** | Thêm / sửa / xóa bài; danh mục (Chung, Tập luyện, Thi đấu, Sự kiện, Thành tích, Thông báo); **Đăng ngay** hoặc **Lưu nháp** | Trang chủ, *Tin tức*. Bản nháp **không** hiện với khách |
| **Sự kiện** | Thêm / sửa / xóa; ngày, địa điểm, trạng thái (sắp tới, đang diễn ra, kết thúc, đã hủy) | Trang chủ (đếm ngược), *Sự kiện* |
| **Cảm nhận SV** | Thêm / sửa / ẩn cảm nhận của sinh viên, số sao | *Cảm nhận sinh viên* |
| **Thư viện ảnh** | Tạo album, tải ảnh lên (lưu trên Cloudinary), sửa chú thích, xóa ảnh / album | Mục *Thành tích & Hoạt động* ở trang chủ, *Thư viện* |
| **Hoạt động** | Thành tích thi đấu, biểu diễn, sự kiện, tập luyện; huy chương Vàng / Bạc / Đồng | *Thành tích* |
| **Thành viên** | Thêm tài khoản; **Sửa** (vai trò, trạng thái hội viên, đai, ghi chú); **Khóa / Mở khóa**; **Xóa** | — |
| **Liên hệ** | Đọc tin nhắn từ form liên hệ, **trả lời qua email**, đổi trạng thái (mới, đã đọc, đã trả lời, lưu trữ) | — |

### Quy tắc Khóa / Xóa thành viên

- Không thể khóa, xóa hay tự đổi vai trò **của chính mình** (dòng của bạn có nhãn **"Bạn"**).
- Luôn phải còn **ít nhất 1 Admin đang hoạt động** — hệ thống chặn thao tác làm mất Admin cuối cùng.
- **Khóa**: người đó bị đăng xuất ngay và không đăng nhập được; mở khóa lại bất cứ lúc nào. Nên dùng thay cho xóa.
- **Xóa**: vĩnh viễn. Tài khoản còn dữ liệu liên quan (vd: đã thăng đai cho người khác) sẽ không xóa được — hệ thống gợi ý dùng **Khóa**.

## Đổi mật khẩu admin

Trang quản trị chưa có màn hình đổi mật khẩu. Đổi qua API (PowerShell), thay `<…>` bằng giá trị thật:

```powershell
$api = "https://clb-vo-co-truyen-hutech.onrender.com/api"
$login = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType "application/json" `
  -Body (@{ email = "admin@vocotruyenhutech.edu.vn"; password = "<mật khẩu hiện tại>" } | ConvertTo-Json)
Invoke-RestMethod "$api/auth/change-password" -Method Put -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $($login.data.token)" } `
  -Body (@{ current_password = "<mật khẩu hiện tại>"; new_password = "<mật khẩu mới>"; confirm_password = "<mật khẩu mới>" } | ConvertTo-Json)
```

Mật khẩu mới: tối thiểu 8 ký tự, có chữ hoa, chữ thường và số. Đổi xong, các phiên đăng nhập khác bị đăng xuất.

## Quên mật khẩu admin

Cần `DATABASE_URL` của Neon (Render → Environment). Trên máy đã clone repo:

```powershell
cd backend
$env:DATABASE_URL = "<connection string Neon>"
npm run reset-admin:prod
```

Script đặt mật khẩu **ngẫu nhiên** (hoặc lấy từ biến `ADMIN_PASSWORD` nếu có đặt), in ra **một lần** trên màn hình —
lưu ngay vào trình quản lý mật khẩu. Nếu tài khoản admin chưa tồn tại, script tạo mới.
Sau đó xóa biến: `Remove-Item Env:DATABASE_URL`.

> Không dán mật khẩu, token hay `DATABASE_URL` vào file trong repo, tin nhắn nhóm hoặc ảnh chụp màn hình.
