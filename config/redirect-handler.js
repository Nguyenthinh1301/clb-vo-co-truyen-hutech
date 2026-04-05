/**
 * Redirect Handler
 * Xử lý redirect sau khi đăng nhập dựa trên role
 */

const RedirectHandler = {
    /**
     * Redirect user sau khi đăng nhập thành công
     */
    redirectAfterLogin() {
        const user = Auth.getCurrentUser();
        
        if (!user) {
            console.error('No user found');
            return;
        }
        
        // Redirect dựa trên role
        if (user.role === 'admin') {
            // Admin -> Admin Dashboard
            window.location.href = '/dashboard/dashboard.html';
        } else {
            // Member/Instructor -> User Dashboard
            window.location.href = '/dashboard/user-dashboard.html';
        }
    },
    
    /**
     * Check và redirect nếu đã đăng nhập
     */
    checkAndRedirect() {
        if (Auth.isAuthenticated()) {
            this.redirectAfterLogin();
        }
    }
};

// Export
if (typeof window !== 'undefined') {
    window.RedirectHandler = RedirectHandler;
}
