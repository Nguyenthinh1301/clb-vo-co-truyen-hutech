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
    var PRODUCTION_API_BASE = 'https://api.vocotruyenhutech.edu.vn/api';
    // ─────────────────────────────────────────────────────────

    var h       = window.location.hostname;
    var isLocal = (h === 'localhost' || h === '127.0.0.1' || h === '');

    var apiBase;
    if (isLocal) {
        apiBase = 'http://localhost:3001/api';
    } else if (PRODUCTION_API_BASE) {
        apiBase = PRODUCTION_API_BASE;
    } else {
        apiBase = 'https://api.' + h + '/api';
    }

    window.APP_CONFIG = {
        API_BASE:    apiBase,
        BACKEND_URL: apiBase.replace('/api', '')
    };
})();
