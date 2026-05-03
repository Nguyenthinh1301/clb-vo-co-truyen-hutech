const { body, param, query, validationResult } = require('express-validator');

/**
 * Parse và validate pagination params từ query string
 * Ngăn chặn ?limit=999999 làm quá tải DB
 * @param {object} queryParams - req.query
 * @param {number} defaultLimit - giới hạn mặc định
 * @param {number} maxLimit - giới hạn tối đa cho phép
 * @returns {{ page, limit, offset }}
 */
function parsePagination(queryParams, defaultLimit = 20, maxLimit = 100) {
    let page  = parseInt(queryParams.page)  || 1;
    let limit = parseInt(queryParams.limit) || defaultLimit;

    // Đảm bảo giá trị hợp lệ
    if (page  < 1)        page  = 1;
    if (limit < 1)        limit = 1;
    if (limit > maxLimit) limit = maxLimit;  // Giới hạn tối đa

    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    
    next();
};

// Common validation rules
const ValidationRules = {
    // User validation
    userRegistration: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email không hợp lệ'),
        body('username')
            .isLength({ min: 3, max: 50 })
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username phải từ 3-50 ký tự và chỉ chứa chữ, số, dấu gạch dưới'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'),
        body('first_name')
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Tên phải từ 1-100 ký tự'),
        body('last_name')
            .trim()
            .isLength({ min: 0, max: 100 })
            .withMessage('Họ không được quá 100 ký tự'),
        body('phone_number')
            .optional()
            .matches(/^(0|\+84)[0-9]{9,10}$/)
            .withMessage('Số điện thoại không hợp lệ'),
        body('date_of_birth')
            .optional()
            .isISO8601()
            .withMessage('Ngày sinh không hợp lệ'),
        body('gender')
            .optional()
            .isIn(['male', 'female', 'other'])
            .withMessage('Giới tính không hợp lệ')
    ],

    userLogin: [
        body('email')
            .notEmpty()
            .withMessage('Email hoặc username là bắt buộc'),
        body('password')
            .notEmpty()
            .withMessage('Mật khẩu là bắt buộc')
    ],

    userUpdate: [
        body('first_name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Tên phải từ 1-100 ký tự'),
        body('last_name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Họ phải từ 1-100 ký tự'),
        body('phone_number')
            .optional()
            .matches(/^(0|\+84)[0-9]{9,10}$/)
            .withMessage('Số điện thoại không hợp lệ'),
        body('date_of_birth')
            .optional()
            .isISO8601()
            .withMessage('Ngày sinh không hợp lệ'),
        body('gender')
            .optional()
            .isIn(['male', 'female', 'other'])
            .withMessage('Giới tính không hợp lệ'),
        body('address')
            .optional()
            .isLength({ max: 500 })
            .withMessage('Địa chỉ không được quá 500 ký tự')
    ],

    changePassword: [
        body('current_password')
            .notEmpty()
            .withMessage('Mật khẩu hiện tại là bắt buộc'),
        body('new_password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'),
        body('confirm_password')
            .custom((value, { req }) => {
                if (value !== req.body.new_password) {
                    throw new Error('Xác nhận mật khẩu không khớp');
                }
                return true;
            })
    ],

    // Class validation
    classCreation: [
        body('name')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Tên lớp học phải từ 1-255 ký tự'),
        body('instructor_id')
            .isInt({ min: 1 })
            .withMessage('ID huấn luyện viên không hợp lệ'),
        body('level')
            .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
            .withMessage('Cấp độ không hợp lệ'),
        body('schedule')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Lịch học là bắt buộc'),
        body('start_date')
            .isISO8601()
            .withMessage('Ngày bắt đầu không hợp lệ'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('Ngày kết thúc không hợp lệ'),
        body('max_students')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Số học viên tối đa phải từ 1-50'),
        body('fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Học phí phải là số dương')
    ],

    classUpdate: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Tên lớp học phải từ 1-255 ký tự'),
        body('level')
            .optional()
            .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
            .withMessage('Cấp độ không hợp lệ'),
        body('schedule')
            .optional()
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Lịch học không được để trống'),
        body('max_students')
            .optional()
            .isInt({ min: 1, max: 50 })
            .withMessage('Số học viên tối đa phải từ 1-50'),
        body('fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Học phí phải là số dương'),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'completed', 'cancelled'])
            .withMessage('Trạng thái không hợp lệ')
    ],

    // Event validation
    eventCreation: [
        body('title')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Tiêu đề sự kiện phải từ 1-255 ký tự'),
        body('type')
            .isIn(['tournament', 'demonstration', 'workshop', 'seminar', 'social', 'training_camp'])
            .withMessage('Loại sự kiện không hợp lệ'),
        body('start_date')
            .isISO8601()
            .withMessage('Ngày bắt đầu không hợp lệ'),
        body('end_date')
            .optional()
            .isISO8601()
            .withMessage('Ngày kết thúc không hợp lệ'),
        body('start_time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .withMessage('Giờ bắt đầu không hợp lệ (HH:MM)'),
        body('end_time')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
            .withMessage('Giờ kết thúc không hợp lệ (HH:MM)'),
        body('max_participants')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Số người tham gia tối đa phải là số dương'),
        body('registration_fee')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Phí đăng ký phải là số dương'),
        body('registration_deadline')
            .optional()
            .isISO8601()
            .withMessage('Hạn đăng ký không hợp lệ')
    ],

    // Attendance validation
    attendanceRecord: [
        body('user_id')
            .isInt({ min: 1 })
            .withMessage('ID người dùng không hợp lệ'),
        body('class_id')
            .isInt({ min: 1 })
            .withMessage('ID lớp học không hợp lệ'),
        body('date')
            .isISO8601()
            .withMessage('Ngày không hợp lệ'),
        body('status')
            .isIn(['present', 'absent', 'late', 'excused'])
            .withMessage('Trạng thái điểm danh không hợp lệ')
    ],

    // Contact message validation
    contactMessage: [
        body('name')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Tên phải từ 1-255 ký tự'),
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email không hợp lệ'),
        body('phone')
            .optional()
            .matches(/^(0|\+84)[0-9]{9,10}$/)
            .withMessage('Số điện thoại không hợp lệ'),
        body('subject')
            .optional()
            .trim()
            .isLength({ max: 255 })
            .withMessage('Tiêu đề không được quá 255 ký tự'),
        body('message')
            .trim()
            .isLength({ min: 1, max: 2000 })
            .withMessage('Tin nhắn phải từ 1-2000 ký tự')
    ],

    // Notification validation
    notificationCreation: [
        body('title')
            .trim()
            .isLength({ min: 1, max: 255 })
            .withMessage('Tiêu đề thông báo phải từ 1-255 ký tự'),
        body('message')
            .trim()
            .isLength({ min: 1, max: 2000 })
            .withMessage('Nội dung thông báo phải từ 1-2000 ký tự'),
        body('type')
            .optional()
            .isIn(['system', 'class', 'event', 'promotion', 'payment', 'general'])
            .withMessage('Loại thông báo không hợp lệ'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent'])
            .withMessage('Mức độ ưu tiên không hợp lệ'),
        body('user_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID người dùng không hợp lệ')
    ],

    // Parameter validation
    idParam: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID không hợp lệ')
    ],

    // Query validation
    paginationQuery: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Trang phải là số dương'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Giới hạn phải từ 1-100')
    ],

    searchQuery: [
        query('q')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Từ khóa tìm kiếm phải từ 1-100 ký tự')
    ],

    // File upload validation
    fileUpload: [
        body('file_type')
            .optional()
            .isIn(['image', 'document', 'video'])
            .withMessage('Loại file không hợp lệ')
    ],

    // Password reset validation
    passwordReset: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Email không hợp lệ')
    ],

    passwordResetConfirm: [
        body('token')
            .notEmpty()
            .withMessage('Token là bắt buộc'),
        body('new_password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số'),
        body('confirm_password')
            .custom((value, { req }) => {
                if (value !== req.body.new_password) {
                    throw new Error('Xác nhận mật khẩu không khớp');
                }
                return true;
            })
    ],

    // OTP validation
    otpVerification: [
        body('code')
            .isLength({ min: 4, max: 10 })
            .isNumeric()
            .withMessage('Mã OTP phải là số từ 4-10 chữ số'),
        body('type')
            .isIn(['email_verification', 'password_reset', 'phone_verification', 'login_2fa'])
            .withMessage('Loại OTP không hợp lệ')
    ]
};

// Custom validation functions
const customValidations = {
    // Check if date is in the future
    isFutureDate: (value) => {
        const date = new Date(value);
        const now = new Date();
        return date > now;
    },

    // Check if end date is after start date
    isEndDateAfterStartDate: (endDate, { req }) => {
        if (!endDate || !req.body.start_date) return true;
        
        const start = new Date(req.body.start_date);
        const end = new Date(endDate);
        return end >= start;
    },

    // Check if end time is after start time
    isEndTimeAfterStartTime: (endTime, { req }) => {
        if (!endTime || !req.body.start_time) return true;
        
        const [startHour, startMin] = req.body.start_time.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        return endMinutes > startMinutes;
    },

    // Check if user is at least 16 years old
    isMinimumAge: (dateOfBirth) => {
        if (!dateOfBirth) return true;
        
        const birth = new Date(dateOfBirth);
        const now = new Date();
        const age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        
        return age >= 16;
    }
};

module.exports = {
    ValidationRules,
    handleValidationErrors,
    customValidations,
    parsePagination
};