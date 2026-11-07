/**
 * APP CONFIG — Tự động chọn API URL theo môi trường
 *
 * Development : http://localhost:3001/api
 * Production  : https://api.<domain>/api
 *
 * Để override thủ công khi deploy, sửa PRODUCTION_API_BASE bên dưới.
 */
(function() {
    // ── Điền URL API production của bạn vào đây ──────────────
    // Ví dụ: 'https://api.vocotruyenhutech.edu.vn/api'
    //        'https://vocotruyenhutech.edu.vn/api'   (nếu cùng domain)
    var PRODUCTION_API_BASE = 'https://clb-vo-co-truyen-hutech.onrender.com/api';
    // ─────────────────────────────────────────────────────────

    var h = window.location.hostname;
    var protocol = window.location.protocol;
    
    // Kiểm tra môi trường local - bao gồm cả khi có port (Live Server)
    var isLocal = (
        h === 'localhost' || 
        h === '127.0.0.1' || 
        h === '' ||
        protocol === 'file:' ||
        // Kiểm tra nếu hostname bắt đầu với localhost hoặc 127.0.0.1 (có thể có subdomain)
        h.indexOf('localhost') === 0 ||
        h.indexOf('127.0.0.1') === 0
    );

    // Khi chạy local (Live Server…) có thể dùng backend THẬT thay vì phải chạy backend trên máy:
    //   localStorage.setItem('API_TARGET', 'production')  → dùng production
    //   localStorage.removeItem('API_TARGET')             → quay về backend local (cổng 3001)
    // Trang đăng nhập Admin có sẵn nút bật/tắt lựa chọn này.
    var useProdFromLocal = false;
    try { useProdFromLocal = isLocal && localStorage.getItem('API_TARGET') === 'production'; } catch (e) {}

    var apiBase;
    if (isLocal && !useProdFromLocal) {
        apiBase = 'http://localhost:3001/api';
        console.log('🔧 [CONFIG] Development mode - Using local backend: ' + apiBase);
    } else if (PRODUCTION_API_BASE) {
        apiBase = PRODUCTION_API_BASE;
        if (useProdFromLocal) console.log('🌐 [CONFIG] Local page → PRODUCTION backend: ' + apiBase);
    } else {
        apiBase = 'https://api.' + h + '/api';
    }

    window.APP_CONFIG = {
        API_BASE:    apiBase,
        BACKEND_URL: apiBase.replace('/api', ''),
        IS_LOCAL_PAGE: isLocal,               // trang đang mở từ máy local
        USING_PROD_FROM_LOCAL: useProdFromLocal // trang local nhưng gọi backend thật
    };
    // Log debug chỉ khi chạy local — không in thông tin cấu hình ra console của người dùng thật
})();
