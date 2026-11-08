/**
 * Jest setup — chạy TRƯỚC khi nạp bất kỳ module nào (jest.config.js → setupFiles).
 * Cố định biến môi trường để test không phụ thuộc file .env trên máy
 * (dotenv không ghi đè biến đã có sẵn).
 */
process.env.NODE_ENV = 'production';        // test đúng cấu hình production (giới hạn đăng nhập, ẩn lỗi…)
process.env.DB_TYPE = 'postgres';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CORS_ORIGIN = 'https://vocotruyenhutech.netlify.app';
process.env.RATE_LIMIT_MAX_REQUESTS = '500';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.TRUST_CF_CONNECTING_IP = 'true';
process.env.RESEND_API_KEY = '';            // không gửi email thật
process.env.SMTP_PASS = '';
