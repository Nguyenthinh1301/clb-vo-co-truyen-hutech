/**
 * Authentication Manager for CLB Võ Cổ Truyền HUTECH
 * Handles user authentication and session management
 */

class AuthManager {
    constructor() {
        this.apiClient = new ApiClient();
        this.authAPI = new AuthAPI(this.apiClient);
        this.currentUser = null;
        this.token = null;
        this.loadFromStorage();
    }

    /**
     * Load authentication data from localStorage
     */
    loadFromStorage() {
        try {
            const token = localStorage.getItem('authToken');
            const userStr = localStorage.getItem('currentUser');
            
            if (token && userStr) {
                this.token = token;
                this.currentUser = JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Error loading auth data:', error);
            this.clearAuth();
        }
    }

    /**
     * Save authentication data to localStorage
     */
    saveToStorage(token, user) {
        try {
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.token = token;
            this.currentUser = user;
        } catch (error) {
            console.error('Error saving auth data:', error);
        }
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        // Clear all auth-related data from localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('demoInfoShown'); // Reset demo info
        
        // Clear instance variables
        this.token = null;
        this.currentUser = null;
        
        console.log('Auth data cleared successfully');
    }

    /**
     * Login user with auto-retry on network errors
     */
    async login(email, password, remember = false) {
        const maxRetries = 2;
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.authAPI.login({
                    email: email,
                    password: password
                });

                console.log('Login response:', response);

                if (response.success && response.data) {
                    // The API client wraps the backend response in response.data
                    // The actual backend data is in response.data.data
                    const backendData = response.data.data || response.data;
                    const { token, refreshToken, user } = backendData;
                    
                    // Save authentication data
                    this.saveToStorage(token, user);
                    
                    // Save refresh token if remember me is checked
                    if (remember && refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                    }

                    return {
                        success: true,
                        user: user,
                        message: 'Đăng nhập thành công'
                    };
                } else {
                    // Handle network and connection errors
                    if (response.code === 'NETWORK_ERROR' || response.code === 'CONNECTION_FAILED' || response.code === 'TIMEOUT') {
                        lastError = {
                            success: false,
                            message: response.message,
                            code: response.code,
                            isNetworkError: true
                        };
                        
                        // Retry on network errors
                        if (attempt < maxRetries) {
                            console.log(`Network error, retrying... (${attempt + 1}/${maxRetries})`);
                            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                            continue;
                        }
                        
                        return lastError;
                    }
                    
                    return {
                        success: false,
                        message: response.message || response.error?.message || 'Đăng nhập thất bại'
                    };
                }
            } catch (error) {
                console.error('Login error:', error);
                lastError = error;
                
                // Handle rate limiting and other HTTP errors
                if (error.response) {
                    const status = error.response.status;
                    const data = error.response.data;
                    
                    if (status === 429) {
                        // Rate limiting error - don't retry
                        const retryAfter = error.response.headers['retry-after'] || 900;
                        const errorObj = new Error(data.message || 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.');
                        errorObj.status = 429;
                        errorObj.retryAfter = retryAfter;
                        throw errorObj;
                    } else if (status === 401) {
                        // Authentication error - don't retry
                        return {
                            success: false,
                            message: data.message || 'Email hoặc mật khẩu không chính xác'
                        };
                    }
                }
                
                // Handle network errors - retry
                if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
                    if (attempt < maxRetries) {
                        console.log(`Network error, retrying... (${attempt + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    }
                    
                    return {
                        success: false,
                        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.',
                        code: 'NETWORK_ERROR',
                        isNetworkError: true
                    };
                }
                
                // Other errors - don't retry
                break;
            }
        }
        
        // If we get here, all retries failed
        return {
            success: false,
            message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.',
            error: lastError
        };
    }

    /**
     * Register new user with auto-retry
     */
    async register(userData) {
        const maxRetries = 2;
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Map frontend form data to backend API format
                const apiData = {
                    email: userData.email,
                    username: userData.email.split('@')[0], // Generate username from email
                    password: userData.password,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    phone_number: userData.phone,
                    date_of_birth: userData.birthDate,
                    gender: userData.gender,
                    address: null // Not collected in form yet
                    // Note: experience and studentId are not sent to backend as they're not in the API schema
                };

                const response = await this.authAPI.register(apiData);

                console.log('Register response:', response);

                if (response.success && response.data) {
                    // The API client wraps the backend response in response.data
                    // The actual backend data is in response.data.data
                    const backendData = response.data.data || response.data;
                    const { token, user } = backendData;
                    this.saveToStorage(token, user);

                    return {
                        success: true,
                        user: user,
                        message: 'Đăng ký thành công'
                    };
                } else {
                    // Handle network errors
                    if (response.code === 'NETWORK_ERROR' || response.code === 'CONNECTION_FAILED' || response.code === 'TIMEOUT') {
                        lastError = {
                            success: false,
                            message: response.message,
                            code: response.code,
                            isNetworkError: true
                        };
                        
                        // Retry on network errors
                        if (attempt < maxRetries) {
                            console.log(`Network error, retrying... (${attempt + 1}/${maxRetries})`);
                            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                            continue;
                        }
                        
                        return lastError;
                    }
                    
                    // Return error with validation details if available
                    return {
                        success: false,
                        message: response.message || response.error?.message || 'Đăng ký thất bại',
                        errors: response.data?.errors || response.errors || null,
                        data: response.data || null
                    };
                }
            } catch (error) {
                console.error('Register error:', error);
                lastError = error;
                
                // Handle network errors - retry
                if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
                    if (attempt < maxRetries) {
                        console.log(`Network error, retrying... (${attempt + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    }
                    
                    return {
                        success: false,
                        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.',
                        code: 'NETWORK_ERROR',
                        isNetworkError: true
                    };
                }
                
                // Other errors - don't retry
                break;
            }
        }
        
        return {
            success: false,
            message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.',
            error: lastError
        };
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call backend logout API if token exists
            if (this.token) {
                await this.authAPI.logout();
            }
        } catch (error) {
            console.error('Logout API error:', error);
            // Continue with local logout even if API fails
        } finally {
            // Always clear local auth data
            this.clearAuth();
            
            // Force reload to clear any cached state
            window.location.replace('/website/views/account/dang-nhap.html');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get auth token
     */
    getToken() {
        return this.token;
    }

    /**
     * Refresh authentication token
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await this.authAPI.refreshToken();

            if (response.success && response.data) {
                const { token, user } = response.data;
                this.saveToStorage(token, user);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearAuth();
            return false;
        }
    }

    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.authAPI.changePassword(currentPassword, newPassword);

            return {
                success: response.success,
                message: response.message || (response.success ? 'Đổi mật khẩu thành công' : 'Đổi mật khẩu thất bại')
            };
        } catch (error) {
            console.error('Change password error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đổi mật khẩu'
            };
        }
    }

    /**
     * Forgot password
     */
    async forgotPassword(email) {
        try {
            const response = await this.authAPI.forgotPassword(email);

            return {
                success: response.success,
                message: response.message || (response.success ? 'Email khôi phục đã được gửi' : 'Gửi email thất bại')
            };
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi gửi email khôi phục'
            };
        }
    }

    /**
     * Reset password
     */
    async resetPassword(token, newPassword) {
        try {
            const response = await this.authAPI.resetPassword(token, newPassword);

            return {
                success: response.success,
                message: response.message || (response.success ? 'Đặt lại mật khẩu thành công' : 'Đặt lại mật khẩu thất bại')
            };
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                message: 'Có lỗi xảy ra khi đặt lại mật khẩu'
            };
        }
    }
}

// Create global Auth instance
const Auth = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, Auth };
} else {
    window.Auth = Auth;
    window.AuthManager = AuthManager;
}

console.log('Authentication Manager loaded successfully');
