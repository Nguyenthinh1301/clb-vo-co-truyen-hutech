# Config Folder - CLB Võ Cổ Truyền HUTECH

Thư mục này chứa tất cả các file cấu hình và quản lý cơ sở dữ liệu cho website CLB Võ Cổ Truyền HUTECH.

## 📁 Cấu trúc Files

### 1. `config.js`
- **Mục đích**: Chứa tất cả cấu hình chính của ứng dụng
- **Nội dung**:
  - Thông tin ứng dụng (tên, phiên bản, mô tả)
  - Cấu hình cơ sở dữ liệu
  - Định nghĩa vai trò người dùng
  - Trạng thái thành viên
  - Cài đặt ứng dụng
  - Validation rules
  - Tin nhắn hệ thống
  - Các tiện ích ConfigUtils

### 2. `database.js`
- **Mục đích**: Quản lý cơ sở dữ liệu IndexedDB
- **Chức năng**:
  - Khởi tạo và cấu hình database
  - CRUD operations (Create, Read, Update, Delete)
  - Quản lý người dùng
  - Quản lý buổi tập
  - Quản lý thành tích
  - Quản lý tin nhắn liên hệ
  - Seed dữ liệu mẫu
  - Export/Import dữ liệu

### 3. `auth.js`
- **Mục đích**: Quản lý xác thực và phiên đăng nhập
- **Chức năng**:
  - Đăng ký tài khoản
  - Đăng nhập/Đăng xuất
  - Quản lý phiên làm việc
  - Cập nhật thông tin cá nhân
  - Đổi mật khẩu
  - Kiểm tra quyền truy cập
  - Theo dõi hoạt động
  - Bảo mật session

### 4. `utils.js`
- **Mục đích**: Các tiện ích và helper functions
- **Chức năng**:
  - DOM manipulation
  - Date/Time utilities
  - String processing
  - Number formatting
  - Array operations
  - Storage management
  - URL handling
  - Validation utilities
  - UI helpers
  - Debug tools

### 5. `app.js`
- **Mục đích**: Khởi tạo và quản lý ứng dụng
- **Chức năng**:
  - Khởi tạo tất cả modules
  - Setup UI components
  - Event listeners
  - Form enhancements
  - Error handling
  - Performance monitoring

## 🚀 Cách sử dụng

### 1. Tích hợp vào HTML
Thêm các file này vào HTML theo thứ tự:

```html
<!-- 1. Configuration -->
<script src="config/config.js"></script>

<!-- 2. Utilities -->
<script src="config/utils.js"></script>

<!-- 3. Database -->
<script src="config/database.js"></script>

<!-- 4. Authentication -->
<script src="config/auth.js"></script>

<!-- 5. App Initializer -->
<script src="config/app.js"></script>
```

### 2. Sử dụng Database
```javascript
// Tạo người dùng mới
const newUser = await DB.createUser({
    username: 'student1',
    email: 'student@example.com',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    role: 'student'
});

// Lấy người dùng theo email
const user = await DB.getUserByEmail('student@example.com');

// Tạo buổi tập mới
const session = await DB.createTrainingSession({
    title: 'Luyện tập cơ bản',
    date: '2024-12-25',
    startTime: '18:00',
    endTime: '20:00',
    instructor: 'Thầy A'
});
```

### 3. Sử dụng Authentication
```javascript
// Đăng ký
const result = await Auth.register({
    username: 'newuser',
    email: 'new@example.com',
    password: 'strongpassword',
    fullName: 'Người dùng mới'
});

// Đăng nhập
const loginResult = await Auth.login('user@example.com', 'password');

// Kiểm tra xác thực
if (Auth.isAuthenticated()) {
    console.log('User is logged in');
}

// Lấy thông tin user hiện tại
const currentUser = Auth.getCurrentUser();
```

### 4. Sử dụng Utilities
```javascript
// DOM manipulation
Utils.DOM.show('myElement');
Utils.DOM.hide('otherElement');

// Date formatting
const formatted = Utils.DateTime.formatDate(new Date(), 'DD/MM/YYYY');

// String utilities
const slug = Utils.String.generateSlug('Tiêu đề có dấu');

// Storage
Utils.Storage.local.set('myKey', { data: 'value' });
const data = Utils.Storage.local.get('myKey');

// Validation
const isValid = Utils.Validation.isEmail('test@example.com');
```

### 5. Configuration
```javascript
// Lấy cấu hình
const appName = CONFIG.APP.NAME;
const userRoles = CONFIG.USER_ROLES;

// Sử dụng ConfigUtils
const isValidEmail = ConfigUtils.isValidEmail('test@example.com');
const roleDisplay = ConfigUtils.getRoleDisplayName('student');
```

## 🔧 Customization

### Thêm vai trò mới
Trong `config.js`, thêm vào `USER_ROLES`:
```javascript
USER_ROLES: {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student',
    GUEST: 'guest' // Vai trò mới
}
```

### Thêm bảng database mới
Trong `database.js`, thêm vào `createObjectStores()`:
```javascript
if (!this.db.objectStoreNames.contains('newTable')) {
    const newStore = this.db.createObjectStore('newTable', { keyPath: 'id' });
    newStore.createIndex('field1', 'field1', { unique: false });
}
```

### Thêm validation rule mới
Trong `config.js`, thêm vào `VALIDATION`:
```javascript
VALIDATION: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^(0|\+84)[0-9]{9,10}$/,
    CUSTOM_RULE: /^[A-Z]{2}[0-9]{4}$/ // Ví dụ: AB1234
}
```

## 🛡️ Security Notes

1. **Password Hashing**: Hiện tại sử dụng hash đơn giản, nên thay bằng bcrypt trong production
2. **Authentication Token**: Sử dụng JWT thay vì base64 encoding trong production
3. **Data Validation**: Luôn validate dữ liệu ở cả client và server
4. **Session Management**: Cấu hình timeout phù hợp với yêu cầu bảo mật

## 📝 Development Notes

- Tất cả functions đều có error handling
- Console logs để debug (có thể tắt trong production)
- Responsive design support
- LocalStorage backup cho IndexedDB
- Activity logging cho audit trail

## 🔄 Updates

Khi cập nhật cấu hình:
1. Backup dữ liệu hiện tại
2. Test trên môi trường development
3. Cập nhật version number trong CONFIG.APP.VERSION
4. Clear cache nếu cần thiết

## 📞 Support

Nếu có vấn đề với config, kiểm tra:
1. Console logs để xem lỗi
2. IndexedDB trong Developer Tools
3. LocalStorage data
4. Network requests (nếu có)
