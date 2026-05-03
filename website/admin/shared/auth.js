/**
 * Auth module - Quản lý token và session
 * Dùng ở tất cả trang admin TRỪ index.html
 */

const TOKEN_KEY = 'adm_tk';
const USER_KEY  = 'adm_usr';

const Auth = {
    /** Lấy token từ localStorage */
    getToken() {
        return localStorage.getItem(TOKEN_KEY) || null;
    },

    /** Lấy user object */
    getUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch {
            return null;
        }
    },

    /** Lưu sau khi login thành công */
    save(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    /** Xóa khi logout */
    clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    /**
     * Kiểm tra auth — gọi ở đầu mỗi trang admin
     * Nếu không có token → redirect về trang login
     */
    check() {
        const token = this.getToken();
        const user  = this.getUser();

        // Normalize role để tránh lỗi do khoảng trắng hoặc case khác nhau
        const role = user && (user.role || '').toString().trim().toLowerCase();

        if (!token || !user || role !== 'admin') {
            // Tránh redirect loop: chỉ redirect nếu không đang ở trang login
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'index.html' && currentPage !== '') {
                try { sessionStorage.setItem('adm_redirect', window.location.href); } catch(e) {}
                window.location.replace('index.html');
            }
            return null;
        }

        // Kiểm tra token có hết hạn chưa (decode JWT payload)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresIn = (payload.exp * 1000) - Date.now();
            if (expiresIn < 0) {
                // Token đã hết hạn — xóa và redirect
                this.clear();
                const currentPage = window.location.pathname.split('/').pop();
                if (currentPage !== 'index.html' && currentPage !== '') {
                    try { sessionStorage.setItem('adm_redirect', window.location.href); } catch(e) {}
                    window.location.replace('index.html');
                }
                return null;
            }
        } catch(e) {
            // Không parse được JWT — để server kiểm tra
        }

        return user;
    }
};
