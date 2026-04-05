/**
 * Application Configuration for CLB Võ Cổ Truyền HUTECH Website
 * Contains all configuration settings and constants
 */

const CONFIG = {
    // Application Info
    APP: {
        NAME: 'CLB Võ Cổ Truyền HUTECH',
        VERSION: '1.0.0',
        DESCRIPTION: 'Website câu lạc bộ võ cổ truyền trường Đại học Công nghệ TP.HCM',
        AUTHOR: 'CLB Võ Cổ Truyền HUTECH',
        URL: 'https://voco-hutech.edu.vn'
    },

    // Database Configuration
    DATABASE: {
        NAME: 'CLB_VoCo_HUTECH_DB',
        VERSION: 1,
        STORES: {
            USERS: 'users',
            TRAINING_SESSIONS: 'trainingSessions',
            ACHIEVEMENTS: 'achievements',
            EVENTS: 'events',
            ATTENDANCE: 'attendance',
            CONTACT_MESSAGES: 'contactMessages'
        }
    },

    // User Roles
    USER_ROLES: {
        ADMIN: 'admin',
        INSTRUCTOR: 'instructor',
        STUDENT: 'student',
        MEMBER: 'member'
    },

    // Membership Status
    MEMBERSHIP_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        PENDING: 'pending',
        SUSPENDED: 'suspended',
        EXPIRED: 'expired'
    },

    // Session Types
    SESSION_TYPES: {
        REGULAR: 'regular',
        COMPETITION: 'competition',
        SEMINAR: 'seminar',
        WORKSHOP: 'workshop',
        EXAM: 'exam'
    },

    // Achievement Types
    ACHIEVEMENT_TYPES: {
        ATTENDANCE: 'attendance',
        PERFORMANCE: 'performance',
        COMPETITION: 'competition',
        LEADERSHIP: 'leadership',
        COMMUNITY: 'community',
        MILESTONE: 'milestone'
    },

    // Event Status
    EVENT_STATUS: {
        SCHEDULED: 'scheduled',
        ONGOING: 'ongoing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled',
        POSTPONED: 'postponed'
    },

    // Contact Message Status
    MESSAGE_STATUS: {
        NEW: 'new',
        READ: 'read',
        REPLIED: 'replied',
        ARCHIVED: 'archived'
    },

    // Application Settings
    SETTINGS: {
        // Session timeout in minutes
        SESSION_TIMEOUT: 120,
        
        // Maximum file upload size in MB
        MAX_FILE_SIZE: 5,
        
        // Allowed image formats
        ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        
        // Pagination
        ITEMS_PER_PAGE: 10,
        
        // Training session settings
        MAX_PARTICIPANTS_DEFAULT: 25,
        MIN_PARTICIPANTS: 5,
        
        // Password requirements
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_REQUIRE_UPPERCASE: true,
        PASSWORD_REQUIRE_LOWERCASE: true,
        PASSWORD_REQUIRE_NUMBERS: true,
        PASSWORD_REQUIRE_SPECIAL: false,
        
        // Default profile image
        DEFAULT_AVATAR: 'assets/images/default-avatar.svg',
        
        // Contact info
        CONTACT: {
            EMAIL: 'voco@hutech.edu.vn',
            PHONE: '028 5445 7777',
            ADDRESS: '475A Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP.HCM',
            WEBSITE: 'https://hutech.edu.vn'
        },
        
        // Social media links
        SOCIAL_MEDIA: {
            FACEBOOK: 'https://facebook.com/vocotruyen.hutech',
            INSTAGRAM: 'https://instagram.com/vocotruyen_hutech',
            YOUTUBE: 'https://youtube.com/@vocotruyen_hutech',
            ZALO: 'https://zalo.me/vocotruyen_hutech'
        },
        
        // Training schedule
        TRAINING_SCHEDULE: [
            {
                day: 'Thứ 2',
                time: '18:00 - 20:00',
                level: 'Sơ cấp',
                location: 'Phòng tập A'
            },
            {
                day: 'Thứ 4',
                time: '18:00 - 20:00',
                level: 'Trung cấp',
                location: 'Phòng tập B'
            },
            {
                day: 'Thứ 6',
                time: '18:00 - 20:00',
                level: 'Cao cấp',
                location: 'Phòng tập A'
            },
            {
                day: 'Thứ 7',
                time: '14:00 - 16:00',
                level: 'Tất cả cấp độ',
                location: 'Sân tập ngoài trời'
            }
        ]
    },

    // API Endpoints (if using external APIs)
    API: {
        BASE_URL: 'https://api.hutech.edu.vn',
        ENDPOINTS: {
            AUTH: '/auth',
            USERS: '/users',
            SESSIONS: '/sessions',
            EVENTS: '/events'
        }
    },

    // UI Messages
    MESSAGES: {
        SUCCESS: {
            LOGIN: 'Đăng nhập thành công!',
            REGISTER: 'Đăng ký thành công!',
            PROFILE_UPDATE: 'Cập nhật thông tin thành công!',
            PASSWORD_CHANGE: 'Đổi mật khẩu thành công!',
            MESSAGE_SENT: 'Gửi tin nhắn thành công!',
            LOGOUT: 'Đăng xuất thành công!'
        },
        ERROR: {
            INVALID_CREDENTIALS: 'Thông tin đăng nhập không chính xác!',
            EMAIL_EXISTS: 'Email đã được sử dụng!',
            USERNAME_EXISTS: 'Tên đăng nhập đã được sử dụng!',
            WEAK_PASSWORD: 'Mật khẩu không đủ mạnh!',
            NETWORK_ERROR: 'Lỗi kết nối mạng!',
            INVALID_EMAIL: 'Email không hợp lệ!',
            REQUIRED_FIELDS: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
            FILE_TOO_LARGE: 'File quá lớn!',
            INVALID_FILE_FORMAT: 'Định dạng file không được hỗ trợ!',
            SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn!'
        },
        INFO: {
            LOADING: 'Đang tải...',
            SAVING: 'Đang lưu...',
            PROCESSING: 'Đang xử lý...',
            NO_DATA: 'Không có dữ liệu',
            COMING_SOON: 'Tính năng đang được phát triển!'
        }
    },

    // Validation Rules
    VALIDATION: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE: /^(0|\+84)[0-9]{9,10}$/,
        USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
        PASSWORD: {
            MIN_LENGTH: 8,
            PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
        }
    },

    // Local Storage Keys
    STORAGE_KEYS: {
        CURRENT_USER: 'currentUser',
        AUTH_TOKEN: 'authToken',
        REMEMBER_LOGIN: 'rememberLogin',
        USER_PREFERENCES: 'userPreferences',
        THEME: 'theme',
        LANGUAGE: 'language'
    },

    // Theme Configuration
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },

    // Supported Languages
    LANGUAGES: {
        VI: 'vi',
        EN: 'en'
    },

    // Date and Time Formats
    DATE_FORMATS: {
        DISPLAY: 'DD/MM/YYYY',
        API: 'YYYY-MM-DD',
        DATETIME: 'DD/MM/YYYY HH:mm',
        TIME: 'HH:mm'
    },

    // Martial Arts Levels
    MARTIAL_ARTS_LEVELS: [
        { id: 1, name: 'Sơ cấp', description: 'Học viên mới bắt đầu' },
        { id: 2, name: 'Trung cấp', description: 'Đã nắm vững cơ bản' },
        { id: 3, name: 'Cao cấp', description: 'Trình độ nâng cao' },
        { id: 4, name: 'Chuyên nghiệp', description: 'Trình độ chuyên nghiệp' }
    ],

    // Belt/Rank System
    BELT_SYSTEM: [
        { level: 1, name: 'Đai trắng', color: '#FFFFFF', requirements: 'Người mới bắt đầu' },
        { level: 2, name: 'Đai vàng', color: '#FFD700', requirements: '3 tháng luyện tập' },
        { level: 3, name: 'Đai cam', color: '#FFA500', requirements: '6 tháng luyện tập' },
        { level: 4, name: 'Đai xanh lá', color: '#008000', requirements: '1 năm luyện tập' },
        { level: 5, name: 'Đai xanh dương', color: '#0000FF', requirements: '2 năm luyện tập' },
        { level: 6, name: 'Đai nâu', color: '#8B4513', requirements: '3 năm luyện tập' },
        { level: 7, name: 'Đai đen', color: '#000000', requirements: '5 năm luyện tập' }
    ],

    // System Logs
    LOG_LEVELS: {
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error'
    },

    // Performance Metrics
    PERFORMANCE: {
        LOAD_TIME_THRESHOLD: 3000, // 3 seconds
        CACHE_DURATION: 3600000, // 1 hour in milliseconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 second
    }
};

// Utility functions for configuration
const ConfigUtils = {
    // Get nested configuration value
    get(path, defaultValue = null) {
        return path.split('.').reduce((obj, key) => 
            (obj && obj[key] !== undefined) ? obj[key] : defaultValue, CONFIG);
    },

    // Check if user has permission
    hasPermission(userRole, requiredRole) {
        const roles = Object.values(CONFIG.USER_ROLES);
        const userIndex = roles.indexOf(userRole);
        const requiredIndex = roles.indexOf(requiredRole);
        return userIndex >= requiredIndex;
    },

    // Validate email
    isValidEmail(email) {
        return CONFIG.VALIDATION.EMAIL.test(email);
    },

    // Validate phone
    isValidPhone(phone) {
        return CONFIG.VALIDATION.PHONE.test(phone);
    },

    // Validate username
    isValidUsername(username) {
        return CONFIG.VALIDATION.USERNAME.test(username);
    },

    // Validate password strength
    isStrongPassword(password) {
        return password.length >= CONFIG.VALIDATION.PASSWORD.MIN_LENGTH &&
               CONFIG.VALIDATION.PASSWORD.PATTERN.test(password);
    },

    // Format date
    formatDate(date, format = CONFIG.DATE_FORMATS.DISPLAY) {
        if (!date) return '';
        const d = new Date(date);
        
        switch (format) {
            case CONFIG.DATE_FORMATS.DISPLAY:
                return d.toLocaleDateString('vi-VN');
            case CONFIG.DATE_FORMATS.API:
                return d.toISOString().split('T')[0];
            case CONFIG.DATE_FORMATS.DATETIME:
                return d.toLocaleString('vi-VN');
            case CONFIG.DATE_FORMATS.TIME:
                return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            default:
                return d.toString();
        }
    },

    // Get user role display name
    getRoleDisplayName(role) {
        const roleNames = {
            [CONFIG.USER_ROLES.ADMIN]: 'Quản trị viên',
            [CONFIG.USER_ROLES.INSTRUCTOR]: 'Huấn luyện viên',
            [CONFIG.USER_ROLES.STUDENT]: 'Học viên',
            [CONFIG.USER_ROLES.MEMBER]: 'Thành viên'
        };
        return roleNames[role] || 'Không xác định';
    },

    // Get membership status display name
    getStatusDisplayName(status) {
        const statusNames = {
            [CONFIG.MEMBERSHIP_STATUS.ACTIVE]: 'Đang hoạt động',
            [CONFIG.MEMBERSHIP_STATUS.INACTIVE]: 'Không hoạt động',
            [CONFIG.MEMBERSHIP_STATUS.PENDING]: 'Chờ duyệt',
            [CONFIG.MEMBERSHIP_STATUS.SUSPENDED]: 'Tạm ngưng',
            [CONFIG.MEMBERSHIP_STATUS.EXPIRED]: 'Hết hạn'
        };
        return statusNames[status] || 'Không xác định';
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ConfigUtils };
} else {
    window.CONFIG = CONFIG;
    window.ConfigUtils = ConfigUtils;
}

console.log('Configuration loaded successfully');
