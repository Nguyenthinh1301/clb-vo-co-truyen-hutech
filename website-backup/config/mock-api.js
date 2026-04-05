/**
 * Mock API Server for CLB Võ Cổ Truyền HUTECH
 * Simulates backend API responses for development
 */

class MockAPIServer {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        this.sessions = JSON.parse(localStorage.getItem('activeSessions') || '[]');
        this.activities = this.generateMockActivities();
        this.events = this.generateMockEvents();
        this.trainingSchedule = this.generateMockTrainingSchedule();
        this.announcements = this.generateMockAnnouncements();
        
        this.initializeDefaultUsers();
        this.setupMockEndpoints();
    }

    /**
     * Initialize default users for testing
     */
    initializeDefaultUsers() {
        if (this.users.length === 0) {
            const defaultUsers = [
                {
                    id: '1',
                    email: 'admin@hutech.edu.vn',
                    password: this.hashPassword('admin123'),
                    name: 'Quản trị viên',
                    role: 'admin',
                    status: 'active',
                    profile: {
                        firstName: 'Quản trị',
                        lastName: 'Viên',
                        phone: '0123456789',
                        avatar: '/assets/images/default-avatar.svg',
                        membershipStatus: 'active',
                        joinDate: '2024-01-01'
                    },
                    createdAt: new Date('2024-01-01').toISOString()
                },
                {
                    id: '2',
                    email: 'instructor@hutech.edu.vn',
                    password: this.hashPassword('instructor123'),
                    name: 'Huấn luyện viên',
                    role: 'instructor',
                    status: 'active',
                    profile: {
                        firstName: 'Huấn luyện',
                        lastName: 'Viên',
                        phone: '0123456788',
                        avatar: '/assets/images/default-avatar.svg',
                        membershipStatus: 'active',
                        joinDate: '2024-01-15'
                    },
                    createdAt: new Date('2024-01-15').toISOString()
                },
                {
                    id: '3',
                    email: 'student@hutech.edu.vn',
                    password: this.hashPassword('student123'),
                    name: 'Sinh viên',
                    role: 'student',
                    status: 'active',
                    profile: {
                        firstName: 'Sinh',
                        lastName: 'Viên',
                        phone: '0123456787',
                        avatar: '/assets/images/default-avatar.svg',
                        membershipStatus: 'active',
                        joinDate: '2024-02-01'
                    },
                    createdAt: new Date('2024-02-01').toISOString()
                }
            ];
            
            this.users = defaultUsers;
            this.saveUsers();
        }
    }

    /**
     * Simple password hashing (for demo purposes only)
     */
    hashPassword(password) {
        return btoa(password + 'salt');
    }

    /**
     * Verify password
     */
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    /**
     * Generate JWT-like token (mock)
     */
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            iat: Date.now()
        };
        return btoa(JSON.stringify(payload));
    }

    /**
     * Validate token
     */
    validateToken(token) {
        try {
            const payload = JSON.parse(atob(token));
            const user = this.users.find(u => u.id === payload.id);
            return user && user.status === 'active' ? user : null;
        } catch {
            return null;
        }
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
        localStorage.setItem('registeredUsers', JSON.stringify(this.users));
    }

    /**
     * Generate mock activities
     */
    generateMockActivities() {
        return [
            {
                id: '1',
                title: 'Buổi tập cơ bản',
                description: 'Luyện tập các động tác cơ bản',
                date: '2024-12-28',
                time: '19:00-21:00',
                location: 'Phòng tập A1',
                instructor: 'Huấn luyện viên',
                participants: 15,
                maxParticipants: 20
            },
            {
                id: '2',
                title: 'Thi đấu nội bộ',
                description: 'Giải thi đấu võ cổ truyền nội bộ',
                date: '2024-12-30',
                time: '14:00-17:00',
                location: 'Sân thể thao',
                instructor: 'Ban tổ chức',
                participants: 25,
                maxParticipants: 30
            }
        ];
    }

    /**
     * Generate mock events
     */
    generateMockEvents() {
        return [
            {
                id: '1',
                title: 'Giao lưu với CLB võ cổ truyền TDMU',
                description: 'Buổi giao lưu học hỏi kinh nghiệm',
                date: '2025-01-15',
                time: '08:00-17:00',
                location: 'TDMU',
                status: 'upcoming',
                registrationDeadline: '2025-01-10'
            }
        ];
    }

    /**
     * Generate mock training schedule
     */
    generateMockTrainingSchedule() {
        return [
            {
                day: 'monday',
                time: '19:00-21:00',
                activity: 'Võ cổ truyền cơ bản',
                location: 'Phòng tập A1',
                instructor: 'Thầy Minh'
            },
            {
                day: 'wednesday',
                time: '19:00-21:00',
                activity: 'Võ cổ truyền nâng cao',
                location: 'Phòng tập A2',
                instructor: 'Thầy Nam'
            },
            {
                day: 'friday',
                time: '18:00-20:00',
                activity: 'Luyện tập tự do',
                location: 'Sân tập ngoài trời',
                instructor: 'Tự luyện'
            }
        ];
    }

    /**
     * Generate mock announcements
     */
    generateMockAnnouncements() {
        return [
            {
                id: '1',
                title: 'Thông báo lịch tập mới',
                content: 'CLB thông báo lịch tập mới từ tuần sau...',
                author: 'Ban chủ nhiệm',
                date: '2024-12-20',
                priority: 'high',
                status: 'published'
            }
        ];
    }

    /**
     * Setup mock API endpoints
     */
    setupMockEndpoints() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Check if it's an API request
            if (url.includes('/api/v1/')) {
                return this.handleMockRequest(url, options);
            }
            
            // For non-API requests, use original fetch
            return originalFetch(url, options);
        };
    }

    /**
     * Handle mock API requests
     */
    async handleMockRequest(url, options) {
        const method = options.method || 'GET';
        const path = url.split('/api/v1')[1];
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
        
        try {
            let response = await this.routeRequest(method, path, options);
            
            return new Response(JSON.stringify(response.data), {
                status: response.status,
                statusText: response.statusText || 'OK',
                headers: {
                    'Content-Type': 'application/json',
                    ...response.headers
                }
            });
        } catch (error) {
            return new Response(JSON.stringify({
                success: false,
                message: error.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                statusText: 'Internal Server Error',
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    /**
     * Route API requests
     */
    async routeRequest(method, path, options) {
        const body = options.body ? JSON.parse(options.body) : null;
        const token = this.extractToken(options.headers);
        const user = token ? this.validateToken(token) : null;

        // Authentication endpoints
        if (path.startsWith('/auth/')) {
            return this.handleAuthRequest(method, path, body);
        }
        
        // User endpoints
        if (path.startsWith('/users/')) {
            return this.handleUserRequest(method, path, body, user);
        }
        
        // Club endpoints
        if (path.startsWith('/club/')) {
            return this.handleClubRequest(method, path, body, user);
        }
        
        // Admin endpoints
        if (path.startsWith('/admin/')) {
            return this.handleAdminRequest(method, path, body, user);
        }
        
        // Upload endpoints
        if (path.startsWith('/upload/')) {
            return this.handleUploadRequest(method, path, options, user);
        }
        
        throw new Error('Endpoint not found');
    }

    /**
     * Extract auth token from headers
     */
    extractToken(headers = {}) {
        const authHeader = headers.Authorization || headers.authorization;
        return authHeader ? authHeader.replace('Bearer ', '') : null;
    }

    /**
     * Handle authentication requests
     */
    async handleAuthRequest(method, path, body) {
        switch (path) {
            case '/auth/login':
                return this.handleLogin(body);
            
            case '/auth/register':
                return this.handleRegister(body);
            
            case '/auth/logout':
                return this.handleLogout();
            
            case '/auth/google':
                return this.handleGoogleAuth(body);
            
            case '/auth/facebook':
                return this.handleFacebookAuth(body);
            
            case '/auth/change-password':
                return this.handleChangePassword(body);
            
            default:
                throw new Error('Auth endpoint not implemented');
        }
    }

    /**
     * Handle login
     */
    handleLogin(credentials) {
        const { email, password } = credentials;
        const user = this.users.find(u => u.email === email);
        
        if (!user || !this.verifyPassword(password, user.password)) {
            return {
                status: 401,
                data: {
                    success: false,
                    message: 'Email hoặc mật khẩu không chính xác'
                }
            };
        }
        
        if (user.status !== 'active') {
            return {
                status: 403,
                data: {
                    success: false,
                    message: 'Tài khoản đã bị khóa'
                }
            };
        }
        
        const token = this.generateToken(user);
        const userData = { ...user };
        delete userData.password;
        
        return {
            status: 200,
            data: {
                success: true,
                message: 'Đăng nhập thành công',
                data: {
                    user: userData,
                    token: token
                }
            }
        };
    }

    /**
     * Handle registration
     */
    handleRegister(userData) {
        const { email, password, name, profile = {} } = userData;
        
        // Check if user already exists
        if (this.users.find(u => u.email === email)) {
            return {
                status: 400,
                data: {
                    success: false,
                    message: 'Email đã được sử dụng'
                }
            };
        }
        
        const newUser = {
            id: Date.now().toString(),
            email,
            password: this.hashPassword(password),
            name,
            role: 'student',
            status: 'active',
            profile: {
                ...profile,
                avatar: '/assets/images/default-avatar.svg',
                membershipStatus: 'pending',
                joinDate: new Date().toISOString().split('T')[0]
            },
            createdAt: new Date().toISOString()
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        const token = this.generateToken(newUser);
        const userResponse = { ...newUser };
        delete userResponse.password;
        
        return {
            status: 201,
            data: {
                success: true,
                message: 'Đăng ký thành công',
                data: {
                    user: userResponse,
                    token: token
                }
            }
        };
    }

    /**
     * Handle logout
     */
    handleLogout() {
        return {
            status: 200,
            data: {
                success: true,
                message: 'Đăng xuất thành công'
            }
        };
    }

    /**
     * Handle Google authentication
     */
    handleGoogleAuth(body) {
        // Mock Google auth response
        const mockUser = {
            id: 'google_' + Date.now(),
            email: 'google.user@gmail.com',
            name: 'Google User',
            role: 'student',
            status: 'active',
            profile: {
                firstName: 'Google',
                lastName: 'User',
                avatar: 'https://lh3.googleusercontent.com/a/default-user',
                loginMethod: 'google',
                membershipStatus: 'pending',
                joinDate: new Date().toISOString().split('T')[0]
            },
            createdAt: new Date().toISOString()
        };
        
        // Check if user exists
        let existingUser = this.users.find(u => u.email === mockUser.email);
        if (!existingUser) {
            this.users.push(mockUser);
            this.saveUsers();
            existingUser = mockUser;
        }
        
        const token = this.generateToken(existingUser);
        const userResponse = { ...existingUser };
        delete userResponse.password;
        
        return {
            status: 200,
            data: {
                success: true,
                message: 'Đăng nhập Google thành công',
                data: {
                    user: userResponse,
                    token: token
                }
            }
        };
    }

    /**
     * Handle Facebook authentication
     */
    handleFacebookAuth(body) {
        // Mock Facebook auth response
        const mockUser = {
            id: 'facebook_' + Date.now(),
            email: 'facebook.user@fb.com',
            name: 'Facebook User',
            role: 'student',
            status: 'active',
            profile: {
                firstName: 'Facebook',
                lastName: 'User',
                avatar: 'https://graph.facebook.com/me/picture',
                loginMethod: 'facebook',
                membershipStatus: 'pending',
                joinDate: new Date().toISOString().split('T')[0]
            },
            createdAt: new Date().toISOString()
        };
        
        // Check if user exists
        let existingUser = this.users.find(u => u.email === mockUser.email);
        if (!existingUser) {
            this.users.push(mockUser);
            this.saveUsers();
            existingUser = mockUser;
        }
        
        const token = this.generateToken(existingUser);
        const userResponse = { ...existingUser };
        delete userResponse.password;
        
        return {
            status: 200,
            data: {
                success: true,
                message: 'Đăng nhập Facebook thành công',
                data: {
                    user: userResponse,
                    token: token
                }
            }
        };
    }

    /**
     * Handle user requests
     */
    async handleUserRequest(method, path, body, user) {
        if (!user) {
            return {
                status: 401,
                data: { success: false, message: 'Chưa đăng nhập' }
            };
        }
        
        if (path === '/users/profile') {
            if (method === 'GET') {
                return {
                    status: 200,
                    data: {
                        success: true,
                        data: user
                    }
                };
            }
            
            if (method === 'PUT') {
                // Update user profile
                const userIndex = this.users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    this.users[userIndex] = { ...this.users[userIndex], ...body };
                    this.saveUsers();
                    
                    const updatedUser = { ...this.users[userIndex] };
                    delete updatedUser.password;
                    
                    return {
                        status: 200,
                        data: {
                            success: true,
                            message: 'Cập nhật thông tin thành công',
                            data: updatedUser
                        }
                    };
                }
            }
        }
        
        throw new Error('User endpoint not implemented');
    }

    /**
     * Handle club requests
     */
    async handleClubRequest(method, path, body, user) {
        if (path === '/club/training-schedule') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: this.trainingSchedule
                }
            };
        }
        
        if (path === '/club/activities') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: this.activities
                }
            };
        }
        
        if (path === '/club/events') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: this.events
                }
            };
        }
        
        throw new Error('Club endpoint not implemented');
    }

    /**
     * Handle admin requests
     */
    async handleAdminRequest(method, path, body, user) {
        if (!user || user.role !== 'admin') {
            return {
                status: 403,
                data: { success: false, message: 'Không có quyền truy cập' }
            };
        }
        
        if (path === '/admin/dashboard-stats') {
            return {
                status: 200,
                data: {
                    success: true,
                    data: {
                        totalUsers: this.users.length,
                        activeUsers: this.users.filter(u => u.status === 'active').length,
                        totalActivities: this.activities.length,
                        totalEvents: this.events.length
                    }
                }
            };
        }
        
        throw new Error('Admin endpoint not implemented');
    }

    /**
     * Handle upload requests
     */
    async handleUploadRequest(method, path, options, user) {
        if (!user) {
            return {
                status: 401,
                data: { success: false, message: 'Chưa đăng nhập' }
            };
        }
        
        // Mock file upload
        return {
            status: 200,
            data: {
                success: true,
                message: 'Upload thành công',
                data: {
                    url: '/assets/images/uploaded-' + Date.now() + '.jpg',
                    filename: 'uploaded-file.jpg',
                    size: 1024000
                }
            }
        };
    }
}

// Initialize mock API server
const mockAPIServer = new MockAPIServer();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MockAPIServer;
} else {
    window.MockAPIServer = MockAPIServer;
    window.mockAPIServer = mockAPIServer;
}

console.log('Mock API Server initialized successfully');
