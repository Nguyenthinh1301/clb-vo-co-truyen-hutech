/**
 * Authentication Manager for CLB Võ Cổ Truyền HUTECH Website
 * Handles user authentication, session management, and security
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.sessionTimer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize AuthManager
     */
    async init() {
        if (this.isInitialized) return;

        // Check for existing session
        await this.checkExistingSession();
        
        // Setup session timeout
        this.setupSessionTimeout();
        
        // Setup activity tracking
        this.setupActivityTracking();
        
        this.isInitialized = true;
        console.log('AuthManager initialized');
    }

    /**
     * Check for existing user session
     */
    async checkExistingSession() {
        try {
            const userData = localStorage.getItem('currentUser');
            const authToken = localStorage.getItem('authToken');
            
            if (userData && authToken) {
                this.currentUser = JSON.parse(userData);
                
                // For now, assume session is valid (in production, validate with server)
                console.log('Valid session found for user:', this.currentUser.name);
                this.updateHeaderForLoggedInUser();
            }
        } catch (error) {
            console.error('Error checking existing session:', error);
            await this.logout();
        }
    }Session();
        
        // Setup session timeout
        this.setupSessionTimeout();
        
        // Setup activity tracking
        this.setupActivityTracking();
        
        this.isInitialized = true;
        console.log('AuthManager initialized');
    }

    /**
     * Check for existing user session
     */
    async checkExistingSession() {
        try {
            const userData = localStorage.getItem('currentUser');
            const authToken = localStorage.getItem('authToken');
            
            if (userData && authToken) {
                this.currentUser = JSON.parse(userData);
                
                // For now, assume session is valid (in production, validate with server)
                console.log('Valid session found for user:', this.currentUser.name);
                this.updateHeaderForLoggedInUser();
            }
        } catch (error) {
            console.error('Error checking existing session:', error);
            await this.logout();
        }
    }

    /**
     * User registration
     */
    async register(userData) {
        try {
            // Validate input data
            if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
                return { success: false, message: 'Vui lòng điền đầy đủ thông tin' };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                return { success: false, message: 'Email không hợp lệ' };
            }

            // Get existing users
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Check if user already exists
            const existingUser = registeredUsers.find(user => user.email === userData.email);
            if (existingUser) {
                return { success: false, message: 'Email đã được sử dụng' };
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                email: userData.email,
                password: userData.password, // In production, hash this
                name: `${userData.firstName} ${userData.lastName}`,
                firstName: userData.firstName,
                lastName: userData.lastName,
                phone: userData.phone,
                birthDate: userData.birthDate,
                gender: userData.gender,
                experience: userData.experience,
                role: 'member',
                registrationDate: new Date().toISOString(),
                membershipStatus: 'active'
            };

            // Add to registered users
            registeredUsers.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

            return {
                success: true,
                message: 'Đăng ký thành công',
                user: newUser
            };

        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Đã xảy ra lỗi trong quá trình đăng ký' };
        }
    }

    /**
     * User login
     */
    async login(emailOrUsername, password, rememberMe = false) {
        try {
            // Get registered users from localStorage
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Find user by email or username
            const user = registeredUsers.find(u => 
                u.email === emailOrUsername || 
                u.username === emailOrUsername
            );
            
            if (!user) {
                return {
                    success: false,
                    message: 'Tài khoản không tồn tại'
                };
            }
            
            // Check password (simple comparison - in production use proper hashing)
            if (user.password !== password) {
                return {
                    success: false,
                    message: 'Mật khẩu không chính xác'
                };
            }
            
            // Set current user
            this.currentUser = user;
            
            // Generate auth token
            const authToken = this.generateAuthToken(user);
            
            // Save to localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('authToken', authToken);
            
            if (rememberMe) {
                localStorage.setItem('rememberLogin', 'true');
            }
            
            // Update UI
            this.updateHeaderForLoggedInUser();
            
            // Setup session timeout
            this.setupSessionTimeout();
            
            // Log successful login
            this.logActivity('login', { userId: user.id });
            
            return {
                success: true,
                message: 'Đăng nhập thành công',
                user: user,
                token: authToken
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Đã xảy ra lỗi khi đăng nhập'
            };
        }
    }

    /**
     * User logout
     */
    async logout() {
        try {
            // Log activity
            if (this.currentUser) {
                this.logActivity('logout', { userId: this.currentUser.id });
            }

            // Clear session data
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('rememberLogin');

            // Clear session timer
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
                this.sessionTimer = null;
            }

            // Update UI
            this.updateHeaderForLoggedOutUser();

            console.log('User logged out successfully');

        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        try {
            if (!this.isAuthenticated() || this.currentUser.id !== userId) {
                return { success: false, message: 'Không có quyền cập nhật' };
            }

            // Validate update data
            const validation = this.validateProfileData(updateData);
            if (!validation.isValid) {
                return { success: false, message: validation.message };
            }

            // Update in database
            const updatedUser = {
                ...this.currentUser,
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            await DB.update(CONFIG.DATABASE.STORES.USERS, updatedUser);

            // Update current user
            this.currentUser = updatedUser;
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

            // Update UI
            this.updateHeaderForLoggedInUser();

            return {
                success: true,
                message: CONFIG.MESSAGES.SUCCESS.PROFILE_UPDATE,
                user: updatedUser
            };

        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, message: 'Đã xảy ra lỗi khi cập nhật thông tin' };
        }
    }

    /**
     * Change password
     */
    async changePassword(userId, oldPassword, newPassword) {
        try {
            if (!this.isAuthenticated() || this.currentUser.id !== userId) {
                return { success: false, message: 'Không có quyền thay đổi mật khẩu' };
            }

            // Validate old password
            const hashedOldPassword = this.hashPassword(oldPassword);
            if (this.currentUser.password !== hashedOldPassword) {
                return { success: false, message: 'Mật khẩu cũ không chính xác' };
            }

            // Validate new password
            if (!ConfigUtils.isStrongPassword(newPassword)) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.WEAK_PASSWORD };
            }

            // Hash new password
            const hashedNewPassword = this.hashPassword(newPassword);

            // Update in database
            const updatedUser = {
                ...this.currentUser,
                password: hashedNewPassword,
                updatedAt: new Date().toISOString()
            };

            await DB.update(CONFIG.DATABASE.STORES.USERS, updatedUser);

            // Update current user
            this.currentUser = updatedUser;
            localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

            // Log activity
            this.logActivity('password_change', { userId: userId });

            return {
                success: true,
                message: CONFIG.MESSAGES.SUCCESS.PASSWORD_CHANGE
            };

        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Đã xảy ra lỗi khi đổi mật khẩu' };
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null && this.isSessionValid();
    }

    /**
     * Check if user has specific role
     */
    hasRole(role) {
        return this.isAuthenticated() && this.currentUser.role === role;
    }

    /**
     * Check if user has permission
     */
    hasPermission(requiredRole) {
        if (!this.isAuthenticated()) return false;
        return ConfigUtils.hasPermission(this.currentUser.role, requiredRole);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Validation methods
     */
    validateRegistrationData(data) {
        const required = ['username', 'email', 'password', 'fullName'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                return { isValid: false, message: `${field} là bắt buộc` };
            }
        }

        if (!ConfigUtils.isValidEmail(data.email)) {
            return { isValid: false, message: CONFIG.MESSAGES.ERROR.INVALID_EMAIL };
        }

        if (!ConfigUtils.isValidUsername(data.username)) {
            return { isValid: false, message: 'Tên đăng nhập không hợp lệ' };
        }

        if (!ConfigUtils.isStrongPassword(data.password)) {
            return { isValid: false, message: CONFIG.MESSAGES.ERROR.WEAK_PASSWORD };
        }

        if (data.phoneNumber && !ConfigUtils.isValidPhone(data.phoneNumber)) {
            return { isValid: false, message: 'Số điện thoại không hợp lệ' };
        }

        return { isValid: true };
    }

    validateProfileData(data) {
        if (data.email && !ConfigUtils.isValidEmail(data.email)) {
            return { isValid: false, message: CONFIG.MESSAGES.ERROR.INVALID_EMAIL };
        }

        if (data.phoneNumber && !ConfigUtils.isValidPhone(data.phoneNumber)) {
            return { isValid: false, message: 'Số điện thoại không hợp lệ' };
        }

        return { isValid: true };
    }

    /**
     * Security methods
     */
    hashPassword(password) {
        // Simple hash for demo - use bcrypt or similar in production
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    generateAuthToken(user) {
        const payload = {
            userId: user.id,
            role: user.role,
            timestamp: Date.now()
        };
        
        // Simple token for demo - use JWT in production
        return btoa(JSON.stringify(payload));
    }

    isSessionValid() {
        const authToken = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!authToken) return false;

        try {
            const payload = JSON.parse(atob(authToken));
            const now = Date.now();
            const sessionAge = now - payload.timestamp;
            const maxAge = CONFIG.SETTINGS.SESSION_TIMEOUT * 60 * 1000; // Convert to milliseconds

            return sessionAge < maxAge;
        } catch (error) {
            console.error('Error validating session:', error);
            return false;
        }
    }

    /**
     * Session management
     */
    setupSessionTimeout() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }

        const timeoutMs = CONFIG.SETTINGS.SESSION_TIMEOUT * 60 * 1000;
        this.sessionTimer = setTimeout(() => {
            alert(CONFIG.MESSAGES.ERROR.SESSION_EXPIRED);
            this.logout();
        }, timeoutMs);
    }

    setupActivityTracking() {
        // Track user activity to extend session
        const activities = ['click', 'keypress', 'scroll', 'mousemove'];
        let lastActivity = Date.now();

        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                const now = Date.now();
                if (now - lastActivity > 60000) { // Only update every minute
                    lastActivity = now;
                    if (this.isAuthenticated()) {
                        this.extendSession();
                    }
                }
            });
        });
    }

    extendSession() {
        if (this.isAuthenticated()) {
            const authToken = this.generateAuthToken(this.currentUser);
            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, authToken);
            this.setupSessionTimeout();
        }
    }

    /**
     * UI update methods
     */
    updateHeaderForLoggedInUser() {
        // Show logged-in user menu
        const guestItems = document.querySelectorAll('.guest-only');
        const loggedInItems = document.querySelectorAll('.logged-in-only');
        
        guestItems.forEach(item => item.style.display = 'none');
        loggedInItems.forEach(item => item.style.display = 'block');
        
        // Update user name and avatar
        const userNameElement = document.getElementById('headerUserName');
        const userAvatarElement = document.getElementById('headerUserAvatar');
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.fullName || this.currentUser.username;
        }
        
        if (userAvatarElement && this.currentUser && this.currentUser.profileImage) {
            userAvatarElement.src = this.currentUser.profileImage;
        }
    }

    updateHeaderForLoggedOutUser() {
        // Show guest menu
        const guestItems = document.querySelectorAll('.guest-only');
        const loggedInItems = document.querySelectorAll('.logged-in-only');
        
        guestItems.forEach(item => item.style.display = 'block');
        loggedInItems.forEach(item => item.style.display = 'none');
    }

    /**
     * Activity logging
     */
    logActivity(action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            userId: this.currentUser ? this.currentUser.id : null,
            userAgent: navigator.userAgent,
            url: window.location.href,
            details: details
        };

        // Store in localStorage for now - send to server in production
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('activityLogs', JSON.stringify(logs));
        console.log('Activity logged:', action, details);
    }

    /**
     * Navigation helpers
     */
    navigateToProfile() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/views/')) {
            if (currentPath.includes('/account/')) {
                window.location.href = 'profile.html';
            } else {
                window.location.href = '../account/profile.html';
            }
        } else {
            window.location.href = 'views/account/profile.html';
        }
    }

    navigateToDashboard() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/views/')) {
            if (currentPath.includes('/account/')) {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = '../account/dashboard.html';
            }
        } else {
            window.location.href = 'views/account/dashboard.html';
        }
    }

    redirectAfterLogin() {
        const currentPath = window.location.pathname;
        
        if (this.currentUser.role === CONFIG.USER_ROLES.ADMIN) {
            this.navigateToDashboard();
        } else {
            if (currentPath.includes('/views/')) {
                window.location.href = '../../index.html';
            } else {
                window.location.href = 'index.html';
            }
        }
    }
}

// Create global auth manager instance
const Auth = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} else {
    window.AuthManager = AuthManager;
    window.Auth = Auth;
}

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
    Auth.init().then(() => {
        console.log('AuthManager ready');
    }).catch(error => {
        console.error('Failed to initialize AuthManager:', error);
    });
});

console.log('AuthManager loaded successfully');
