/**
 * API Client for CLB Võ Cổ Truyền HUTECH
 * Handles all HTTP requests to the backend API
 */

class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.defaultHeaders = { ...API_CONFIG.DEFAULT_HEADERS };
    }

    /**
     * Get authentication token from localStorage
     */
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    /**
     * Set authentication headers
     */
    getAuthHeaders() {
        const token = this.getAuthToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Make HTTP request
     */
    async request(method, endpoint, data = null, customHeaders = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const headers = {
            ...this.defaultHeaders,
            ...this.getAuthHeaders(),
            ...customHeaders
        };

        const config = {
            method: method.toUpperCase(),
            headers: headers,
            credentials: 'include'
        };

        // Add body for POST, PUT, PATCH requests
        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            if (data instanceof FormData) {
                // Remove Content-Type header for FormData (browser sets it automatically)
                delete headers['Content-Type'];
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            config.signal = controller.signal;

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle response
            return await this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        let data;
        
        try {
            data = await response.json();
        } catch (error) {
            data = { message: 'Invalid JSON response' };
        }

        if (response.ok) {
            return {
                success: true,
                data: data,
                status: response.status,
                headers: response.headers
            };
        } else {
            // Handle specific error codes
            switch (response.status) {
                case 401:
                    this.handleUnauthorized();
                    break;
                case 403:
                    console.warn('Access forbidden');
                    break;
                case 404:
                    console.warn('Resource not found');
                    break;
                case 422:
                    console.warn('Validation error:', data);
                    break;
                case 500:
                    console.error('Server error');
                    break;
            }

            return {
                success: false,
                error: data,
                status: response.status,
                message: data.message || `HTTP ${response.status} Error`
            };
        }
    }

    /**
     * Handle request errors
     */
    handleError(error) {
        console.error('API Request Error:', error);
        
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timeout',
                message: 'Yêu cầu bị hết thời gian chờ'
            };
        }
        
        return {
            success: false,
            error: error.message,
            message: 'Lỗi kết nối mạng'
        };
    }

    /**
     * Handle unauthorized access
     */
    handleUnauthorized() {
        console.warn('Unauthorized access - clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('dang-nhap.html')) {
            window.location.href = '/views/account/dang-nhap.html';
        }
    }

    // HTTP Methods
    async get(endpoint, params = {}) {
        const urlParams = new URLSearchParams(params);
        const url = urlParams.toString() ? `${endpoint}?${urlParams}` : endpoint;
        return this.request('GET', url);
    }

    async post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    async put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    async patch(endpoint, data) {
        return this.request('PATCH', endpoint, data);
    }

    async delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    // File upload method
    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add additional data to FormData
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        return this.request('POST', endpoint, formData);
    }
}

/**
 * Authentication API
 */
class AuthAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // User login
    async login(credentials) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
    }

    // User registration
    async register(userData) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
    }

    // User logout
    async logout() {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    }

    // Refresh token
    async refreshToken() {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH);
    }

    // Forgot password
    async forgotPassword(email) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    }

    // Reset password
    async resetPassword(token, newPassword) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
            token,
            password: newPassword
        });
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            current_password: currentPassword,
            new_password: newPassword
        });
    }

    // Verify email
    async verifyEmail(token) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    }
}

/**
 * Social Authentication API
 */
class SocialAuthAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Google authentication
    async googleAuth(googleToken) {
        return this.api.post(API_CONFIG.ENDPOINTS.SOCIAL_AUTH.GOOGLE, {
            token: googleToken
        });
    }

    // Facebook authentication
    async facebookAuth(facebookToken) {
        return this.api.post(API_CONFIG.ENDPOINTS.SOCIAL_AUTH.FACEBOOK, {
            token: facebookToken
        });
    }

    // GitHub authentication
    async githubAuth(githubCode) {
        return this.api.post(API_CONFIG.ENDPOINTS.SOCIAL_AUTH.GITHUB, {
            code: githubCode
        });
    }
}

/**
 * User API
 */
class UserAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get user profile
    async getProfile() {
        return this.api.get(API_CONFIG.ENDPOINTS.USERS.PROFILE);
    }

    // Update user profile
    async updateProfile(profileData) {
        return this.api.put(API_CONFIG.ENDPOINTS.USERS.PROFILE, profileData);
    }

    // Upload avatar
    async uploadAvatar(file) {
        return this.api.upload(API_CONFIG.ENDPOINTS.USERS.UPLOAD_AVATAR, file);
    }

    // Get user by ID
    async getUserById(userId) {
        const endpoint = API_CONFIG.ENDPOINTS.USERS.GET_BY_ID.replace('{id}', userId);
        return this.api.get(endpoint);
    }

    // Get all users (admin only)
    async getAllUsers(page = 1, limit = 10, filters = {}) {
        return this.api.get(API_CONFIG.ENDPOINTS.USERS.GET_ALL, {
            page,
            limit,
            ...filters
        });
    }

    // Delete user (admin only)
    async deleteUser(userId) {
        const endpoint = API_CONFIG.ENDPOINTS.USERS.DELETE.replace('{id}', userId);
        return this.api.delete(endpoint);
    }

    // Update user status (admin only)
    async updateUserStatus(userId, status) {
        const endpoint = API_CONFIG.ENDPOINTS.USERS.UPDATE_STATUS.replace('{id}', userId);
        return this.api.patch(endpoint, { status });
    }
}

/**
 * Club API
 */
class ClubAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get club members
    async getMembers(page = 1, limit = 10) {
        return this.api.get(API_CONFIG.ENDPOINTS.CLUB.MEMBERS, { page, limit });
    }

    // Get club activities
    async getActivities(page = 1, limit = 10) {
        return this.api.get(API_CONFIG.ENDPOINTS.CLUB.ACTIVITIES, { page, limit });
    }

    // Get club events
    async getEvents(page = 1, limit = 10) {
        return this.api.get(API_CONFIG.ENDPOINTS.CLUB.EVENTS, { page, limit });
    }

    // Get training schedule
    async getTrainingSchedule() {
        return this.api.get(API_CONFIG.ENDPOINTS.CLUB.TRAINING_SCHEDULE);
    }

    // Get announcements
    async getAnnouncements(page = 1, limit = 10) {
        return this.api.get(API_CONFIG.ENDPOINTS.CLUB.ANNOUNCEMENTS, { page, limit });
    }
}

/**
 * Upload API
 */
class UploadAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Upload image
    async uploadImage(file, category = 'general') {
        return this.api.upload(API_CONFIG.ENDPOINTS.UPLOAD.IMAGE, file, { category });
    }

    // Upload document
    async uploadDocument(file, category = 'general') {
        return this.api.upload(API_CONFIG.ENDPOINTS.UPLOAD.DOCUMENT, file, { category });
    }

    // Upload avatar
    async uploadAvatar(file) {
        return this.api.upload(API_CONFIG.ENDPOINTS.UPLOAD.AVATAR, file);
    }
}

/**
 * Admin API
 */
class AdminAPI {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get dashboard statistics
    async getDashboardStats() {
        return this.api.get(API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD_STATS);
    }

    // Get activity logs
    async getActivityLogs(page = 1, limit = 10, filters = {}) {
        return this.api.get(API_CONFIG.ENDPOINTS.ADMIN.ACTIVITY_LOGS, {
            page,
            limit,
            ...filters
        });
    }

    // Get system settings
    async getSystemSettings() {
        return this.api.get(API_CONFIG.ENDPOINTS.ADMIN.SYSTEM_SETTINGS);
    }

    // Update system settings
    async updateSystemSettings(settings) {
        return this.api.put(API_CONFIG.ENDPOINTS.ADMIN.SYSTEM_SETTINGS, settings);
    }
}

// Create global API instances
const apiClient = new ApiClient();
const authAPI = new AuthAPI(apiClient);
const socialAuthAPI = new SocialAuthAPI(apiClient);
const userAPI = new UserAPI(apiClient);
const clubAPI = new ClubAPI(apiClient);
const uploadAPI = new UploadAPI(apiClient);
const adminAPI = new AdminAPI(apiClient);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ApiClient,
        AuthAPI,
        SocialAuthAPI,
        UserAPI,
        ClubAPI,
        UploadAPI,
        AdminAPI,
        apiClient,
        authAPI,
        socialAuthAPI,
        userAPI,
        clubAPI,
        uploadAPI,
        adminAPI
    };
} else {
    // Make available globally
    window.ApiClient = ApiClient;
    window.AuthAPI = AuthAPI;
    window.SocialAuthAPI = SocialAuthAPI;
    window.UserAPI = UserAPI;
    window.ClubAPI = ClubAPI;
    window.UploadAPI = UploadAPI;
    window.AdminAPI = AdminAPI;
    
    // Global instances
    window.apiClient = apiClient;
    window.authAPI = authAPI;
    window.socialAuthAPI = socialAuthAPI;
    window.userAPI = userAPI;
    window.clubAPI = clubAPI;
    window.uploadAPI = uploadAPI;
    window.adminAPI = adminAPI;
}

console.log('API Client loaded successfully');
