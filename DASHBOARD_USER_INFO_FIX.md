# Fix Dashboard User Info - Hiển thị tên Admin

## ✅ Đã thực hiện

### 1. Cải thiện function loadUserInfo()
```javascript
function loadUserInfo() {
    const user = Auth.getCurrentUser();
    if (user) {
        // Ưu tiên hiển thị tên theo thứ tự:
        // 1. first_name + last_name
        // 2. full_name
        // 3. first_name
        // 4. username
        // 5. email
        
        let displayName = '';
        if (user.first_name && user.last_name) {
            displayName = `${user.first_name} ${user.last_name}`;
        } else if (user.full_name) {
            displayName = user.full_name;
        } else if (user.first_name) {
            displayName = user.first_name;
        } else if (user.username) {
            displayName = user.username;
        } else {
            displayName = user.email;
        }
        
        // Hiển thị role bằng tiếng Việt
        const roleText = user.role === 'admin' ? 'Quản trị viên' : 
                        user.role === 'member' ? 'Thành viên' : 
                        user.role.toUpperCase();
        
        // Format: "Quản trị viên • email@example.com"
        document.getElementById('userRole').textContent = `${roleText} • ${user.email}`;
        
        // Avatar hiển thị chữ cái đầu
        avatar.textContent = displayName.charAt(0).toUpperCase();
    }
}
```

### 2. Thêm logging để debug
- Console.log khi dashboard khởi tạo
- Log user data để kiểm tra
- Log khi load user info
- Giúp debug nếu có vấn đề

### 3. Cải thiện error handling
- Kiểm tra user data có tồn tại không
- Redirect về login nếu không có user
- Hiển thị "Unknown User" nếu không có data

## 🔍 Cách kiểm tra

### Bước 1: Mở Console (F12)
Khi mở dashboard, bạn sẽ thấy logs:
```
Dashboard initializing...
Current user: {email: "admin@example.com", role: "admin", ...}
Loading dashboard for admin user
User info loaded: {name: "Admin Name", role: "Quản trị viên", email: "..."}
```

### Bước 2: Kiểm tra localStorage
Mở Console và chạy:
```javascript
// Xem user data trong localStorage
console.log(JSON.parse(localStorage.getItem('currentUser')));

// Xem token
console.log(localStorage.getItem('authToken'));
```

### Bước 3: Kiểm tra Auth object
```javascript
// Xem current user
console.log(Auth.getCurrentUser());

// Xem có authenticated không
console.log(Auth.isAuthenticated());
```

## 🐛 Troubleshooting

### Vấn đề 1: Vẫn hiển thị "Loading..."
**Nguyên nhân**: User data không được lưu đúng khi login

**Giải pháp**:
1. Kiểm tra backend có trả về đầy đủ user data không
2. Kiểm tra localStorage có data không
3. Xem console có error không

### Vấn đề 2: Hiển thị email thay vì tên
**Nguyên nhân**: Backend không trả về first_name, last_name, full_name

**Giải pháp**:
1. Kiểm tra database có các field này không
2. Kiểm tra backend API có select các field này không
3. Cập nhật profile để thêm tên

### Vấn đề 3: Avatar hiển thị sai chữ cái
**Nguyên nhân**: displayName không đúng

**Giải pháp**:
- Kiểm tra console log để xem displayName là gì
- Đảm bảo user data có ít nhất 1 trong các field: first_name, full_name, username, email

## 📋 Cấu trúc User Data

Backend nên trả về user object với cấu trúc:
```javascript
{
    id: 1,
    email: "admin@hutech.edu.vn",
    username: "admin",
    first_name: "Nguyễn",
    last_name: "Văn A",
    full_name: "Nguyễn Văn A",
    role: "admin",
    phone_number: "0123456789",
    // ... other fields
}
```

## 🔧 Nếu vẫn không hoạt động

### Kiểm tra backend response khi login:
1. Mở Network tab trong DevTools
2. Login lại
3. Xem request `/api/auth/login`
4. Kiểm tra response có chứa user data đầy đủ không

### Ví dụ response đúng:
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGc...",
        "user": {
            "id": 1,
            "email": "admin@hutech.edu.vn",
            "first_name": "Admin",
            "last_name": "HUTECH",
            "role": "admin"
        }
    }
}
```

### Nếu backend không trả về first_name, last_name:
Cần cập nhật backend route `/api/auth/login` để select thêm các field này:
```javascript
// backend/routes/auth.js
const user = await db.findOne(
    `SELECT id, email, username, first_name, last_name, 
     full_name, role, phone_number, profile_image 
     FROM users WHERE email = ?`,
    [email]
);
```

## ✅ Kết quả mong đợi

Sau khi fix, dashboard sẽ hiển thị:
- **Tên**: "Nguyễn Văn A" (hoặc username/email nếu không có tên)
- **Role**: "Quản trị viên • admin@hutech.edu.vn"
- **Avatar**: Chữ "N" (chữ cái đầu của tên)

## 🚀 Test ngay

1. Đăng xuất khỏi dashboard
2. Đăng nhập lại với tài khoản admin
3. Mở Console (F12) để xem logs
4. Kiểm tra header dashboard có hiển thị đúng tên không

Nếu vẫn có vấn đề, gửi cho tôi:
- Screenshot console logs
- User data từ localStorage
- Backend response khi login
