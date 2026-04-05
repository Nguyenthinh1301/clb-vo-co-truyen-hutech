/**
 * API Configuration for CLB Võ Cổ Truyền HUTECH
 * Handles all API endpoints and configurations
 */

// API Base Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001',
    API_VERSION: 'v1',
    ENDPOINTS: {
        // Authentication endpoints
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register',
            LOGOUT: '/api/auth/logout',
            REFRESH: '/api/auth/refresh',
            VERIFY: '/api/auth/verify',
            FORGOT_PASSWORD: '/api/auth/forgot-password',
            RESET_PASSWORD: '/api/auth/reset-password',
            VERIFY_EMAIL: '/api/auth/verify-email',
            CHANGE_PASSWORD: '/api/auth/change-password'
        },
        
        // Social authentication endpoints
        SOCIAL_AUTH: {
            GOOGLE: '/api/v1/auth/google',
            FACEBOOK: '/api/v1/auth/facebook',
            GITHUB: '/api/v1/auth/github'
        },
        
        // User management endpoints
        USERS: {
            PROFILE: '/api/v1/users/profile',
            UPDATE_PROFILE: '/api/v1/users/profile',
            UPLOAD_AVATAR: '/api/v1/users/avatar',
            GET_ALL: '/api/v1/users',
            GET_BY_ID: '/api/v1/users/{id}',
            DELETE: '/api/v1/users/{id}',
            UPDATE_STATUS: '/api/v1/users/{id}/status'
        },
        
        // Club management endpoints
        CLUB: {
            MEMBERS: '/api/v1/club/members',
            ACTIVITIES: '/api/v1/club/activities',
            EVENTS: '/api/v1/club/events',
            TRAINING_SCHEDULE: '/api/v1/club/training-schedule',
            ANNOUNCEMENTS: '/api/v1/club/announcements'
        },
        
        // File upload endpoints
        UPLOAD: {
            IMAGE: '/api/v1/upload/image',
            DOCUMENT: '/api/v1/upload/document',
            AVATAR: '/api/v1/upload/avatar'
        },
        
        // Admin endpoints
        ADMIN: {
            DASHBOARD_STATS: '/api/v1/admin/dashboard-stats',
            USER_MANAGEMENT: '/api/v1/admin/users',
            ACTIVITY_LOGS: '/api/v1/admin/activity-logs',
            SYSTEM_SETTINGS: '/api/v1/admin/settings'
        }
    },
    
    // Request timeout
    TIMEOUT: 30000,
    
    // Default headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    
    // OAuth configurations
    OAUTH: {
        GOOGLE: {
            CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
            SCOPE: 'openid email profile',
            REDIRECT_URI: window.location.origin + '/auth/google/callback'
        },
        FACEBOOK: {
            APP_ID: 'YOUR_FACEBOOK_APP_ID',
            VERSION: 'v18.0',
            SCOPE: 'email,public_profile',
            REDIRECT_URI: window.location.origin + '/auth/facebook/callback'
        }
    },
    
    // Error codes
    ERROR_CODES: {
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        VALIDATION_ERROR: 422,
        SERVER_ERROR: 500,
        NETWORK_ERROR: 0
    },
    
    // Success codes
    SUCCESS_CODES: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        NO_CONTENT: 204
    }
};

// API Response formats
const API_RESPONSES = {
    // Standard success response
    SUCCESS: (data, message = 'Success') => ({
        success: true,
        message: message,
        data: data,
        timestamp: new Date().toISOString()
    }),
    
    // Standard error response
    ERROR: (message, code = 400, errors = null) => ({
        success: false,
        message: message,
        error_code: code,
        errors: errors,
        timestamp: new Date().toISOString()
    }),
    
    // Pagination response
    PAGINATED: (data, pagination) => ({
        success: true,
        data: data,
        pagination: {
            current_page: pagination.page,
            per_page: pagination.limit,
            total: pagination.total,
            total_pages: Math.ceil(pagination.total / pagination.limit)
        },
        timestamp: new Date().toISOString()
    })
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, API_RESPONSES };
} else {
    window.API_CONFIG = API_CONFIG;
    window.API_RESPONSES = API_RESPONSES;
}

console.log('API Configuration loaded successfully');
