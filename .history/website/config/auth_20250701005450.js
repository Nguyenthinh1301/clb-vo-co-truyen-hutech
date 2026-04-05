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
            const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
            const authToken = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            
            if (userData && authToken) {
                this.currentUser = JSON.parse(userData);
                
                // Validate session
                if (this.isSessionValid()) {
                    console.log('Valid session found for user:', this.currentUser.fullName);
                    this.updateHeaderForLoggedInUser();
                } else {
                    console.log('Session expired, logging out');
                    await this.logout();
                }
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
            const validation = this.validateRegistrationData(userData);
            if (!validation.isValid) {
                return { success: false, message: validation.message };
            }

            // Check if user already exists
            const existingUser = await DB.getUserByEmail(userData.email);
            if (existingUser) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.EMAIL_EXISTS };
            }

            const existingUsername = await DB.getUserByUsername(userData.username);
            if (existingUsername) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.USERNAME_EXISTS };
            }

            // Hash password (in production, use proper hashing like bcrypt)
            const hashedPassword = this.hashPassword(userData.password);

            // Create user in database
            const newUser = await DB.createUser({
                ...userData,
                password: hashedPassword,
                role: CONFIG.USER_ROLES.STUDENT,
                membershipStatus: CONFIG.MEMBERSHIP_STATUS.PENDING
            });

            // Auto-login after registration
            const loginResult = await this.login(userData.email, userData.password);
            
            return {
                success: true,
                message: CONFIG.MESSAGES.SUCCESS.REGISTER,
                user: newUser,
                autoLogin: loginResult.success
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
            // Hash password for comparison
            const hashedPassword = this.hashPassword(password);
            
            // Validate credentials with database
            const result = await DB.validateLogin(emailOrUsername, hashedPassword);
            
            if (result.success) {
                // Set current user
                this.currentUser = result.user;
                
                // Generate auth token
                const authToken = this.generateAuthToken(result.user);
                
                // Save to localStorage
                localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(result.user));
                localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, authToken);
                
                if (rememberMe) {
                    localStorage.setItem(CONFIG.STORAGE_KEYS.REMEMBER_LOGIN, 'true');
                }
                
                // Update UI
                this.updateHeaderForLoggedInUser();
                
                // Setup session timeout
                this.setupSessionTimeout();
                
                // Log successful login
                this.logActivity('login', { userId: result.user.id });
                
                return {
                    success: true,
                    message: CONFIG.MESSAGES.SUCCESS.LOGIN,
                    user: result.user,
                    token: authToken
                };
            } else {
                return {
                    success: false,
                    message: CONFIG.MESSAGES.ERROR.INVALID_CREDENTIALS
                };
            }

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: CONFIG.MESSAGES.ERROR.NETWORK_ERROR
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
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.REMEMBER_LOGIN);

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
     * Change user password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.NOT_AUTHENTICATED };
            }

            // Validate current password
            const storedUser = await DB.getUserById(this.currentUser.id);
            if (!storedUser) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.USER_NOT_FOUND };
            }

            const currentPasswordHash = this.hashPassword(currentPassword);
            if (storedUser.password !== currentPasswordHash) {
                return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
            }

            // Validate new password
            if (newPassword.length < CONFIG.PASSWORD_MIN_LENGTH) {
                return { success: false, message: CONFIG.MESSAGES.ERROR.PASSWORD_TOO_SHORT };
            }

            // Hash new password
            const newPasswordHash = this.hashPassword(newPassword);

            // Update password in database
            await DB.updateUser(this.currentUser.id, { password: newPasswordHash });

            // Log activity
            this.logActivity('PASSWORD_CHANGED', { userId: this.currentUser.id });

            return { success: true, message: 'Đổi mật khẩu thành công' };

        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, message: CONFIG.MESSAGES.ERROR.GENERIC };
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
