/**
 * Database Manager for CLB Võ Cổ Truyền HUTECH
 * Manages localStorage operations for user data, sessions, and application state
 * Version: 1.0
 * Created: June 30, 2025
 */

class DatabaseManager {
    constructor() {
        this.prefix = 'vct_hutech_';
        this.version = '1.0';
        this.initializeDatabase();
    }

    /**
     * Initialize database with default structure
     */
    initializeDatabase() {
        // Check if database is already initialized
        if (!this.getSystemSetting('db_initialized')) {
            this.createDefaultStructure();
            this.setSystemSetting('db_initialized', true);
            this.setSystemSetting('db_version', this.version);
            console.log('Database initialized successfully');
        }
    }

    /**
     * Create default localStorage structure
     */
    createDefaultStructure() {
        // Initialize empty arrays for main entities
        const defaultData = {
            users: [],
            sessions: [],
            otp_codes: [],
            email_change_requests: [],
            login_attempts: [],
            classes: [],
            class_enrollments: [],
            attendance: [],
            belt_promotions: [],
            events: [],
            event_registrations: [],
            notifications: [],
            payments: [],
            system_settings: this.getDefaultSettings(),
            audit_logs: []
        };

        // Store each entity in localStorage
        Object.keys(defaultData).forEach(key => {
            this.setItem(key, defaultData[key]);
        });

        // Load sample data
        this.loadSampleData();
    }

    /**
     * Get default system settings
     */
    getDefaultSettings() {
        return {
            site_name: 'CLB Võ Cổ Truyền HUTECH',
            site_description: 'Câu lạc bộ Võ cổ truyền trường Đại học Công nghệ TP.HCM',
            contact_email: 'info@vocotruyenhutech.edu.vn',
            contact_phone: '+84 28 5445 7777',
            address: 'Khu Công nghệ cao TP.HCM, Xa lộ Hà Nội, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM',
            max_login_attempts: 5,
            session_timeout: 86400, // 24 hours in seconds
            otp_expiry_minutes: 5,
            password_reset_expiry_hours: 1,
            email_verification_expiry_hours: 24,
            default_class_duration: 90,
            max_students_per_class: 20,
            enable_registration: true,
            enable_two_factor: true,
            maintenance_mode: false
        };
    }

    /**
     * Load sample data for development
     */
    loadSampleData() {
        // Sample admin user
        this.createUser({
            email: 'admin@vocotruyenhutech.edu.vn',
            password: 'admin123456',
            firstName: 'Quản trị',
            lastName: 'Viên',
            phone: '+84 901 234 567',
            studentId: 'ADMIN001',
            gender: 'male',
            role: 'admin',
            status: 'active',
            emailVerified: true,
            belt: 'black',
            bio: 'Quản trị viên hệ thống CLB Võ Cổ Truyền HUTECH'
        });

        // Sample instructor
        this.createUser({
            email: 'instructor@vocotruyenhutech.edu.vn',
            password: 'instructor123',
            firstName: 'Nguyễn Văn',
            lastName: 'Sư',
            phone: '+84 902 345 678',
            studentId: 'INST001',
            gender: 'male',
            role: 'instructor',
            status: 'active',
            emailVerified: true,
            belt: 'black',
            bio: 'Huấn luyện viên với 15 năm kinh nghiệm trong võ cổ truyền Việt Nam'
        });

        // Sample student
        this.createUser({
            email: 'student@student.hutech.edu.vn',
            password: 'student123',
            firstName: 'Lê Minh',
            lastName: 'Tuấn',
            phone: '+84 904 567 890',
            studentId: '21110001',
            birthDate: '2003-05-15',
            gender: 'male',
            role: 'student',
            status: 'active',
            emailVerified: true,
            belt: 'yellow',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            bio: 'Sinh viên năm 2 khoa Công nghệ Thông tin, đam mê võ thuật truyền thống'
        });

        // Sample classes
        this.createClass({
            name: 'Võ Cổ Truyền Cơ Bản',
            description: 'Lớp học dành cho người mới bắt đầu, tập trung vào các động tác cơ bản và triết lý võ thuật',
            instructorId: this.getUserByEmail('instructor@vocotruyenhutech.edu.vn')?.id,
            level: 'beginner',
            maxStudents: 15,
            scheduleDay: 'tuesday',
            scheduleTime: '18:00',
            duration: 90,
            location: 'Phòng tập A1 - Tòa nhà A',
            price: 200000
        });

        // Sample events
        this.createEvent({
            title: 'Giải Võ Cổ Truyền Sinh Viên 2025',
            description: 'Giải thi đấu võ cổ truyền dành cho sinh viên các trường đại học tại TP.HCM',
            eventType: 'tournament',
            startDate: new Date('2025-08-15T08:00:00').toISOString(),
            endDate: new Date('2025-08-15T17:00:00').toISOString(),
            location: 'Nhà thi đấu Phan Đình Phùng',
            maxParticipants: 100,
            registrationFee: 50000,
            registrationDeadline: new Date('2025-08-01T23:59:59').toISOString(),
            organizerId: this.getUserByEmail('admin@vocotruyenhutech.edu.vn')?.id,
            status: 'upcoming'
        });
    }

    // ================================
    // UTILITY METHODS
    // ================================

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get current timestamp
     */
    getCurrentTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Set item in localStorage with prefix
     */
    setItem(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting localStorage item:', error);
            return false;
        }
    }

    /**
     * Get item from localStorage with prefix
     */
    getItem(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return null;
        }
    }

    /**
     * Remove item from localStorage
     */
    removeItem(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('Error removing localStorage item:', error);
            return false;
        }
    }

    // ================================
    // USER MANAGEMENT
    // ================================

    /**
     * Create new user
     */
    createUser(userData) {
        const users = this.getItem('users') || [];
        
        // Check if email already exists
        if (users.find(user => user.email === userData.email)) {
            throw new Error('Email already exists');
        }

        const newUser = {
            id: this.generateId(),
            email: userData.email,
            password: userData.password, // In production, hash this
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            studentId: userData.studentId || '',
            birthDate: userData.birthDate || null,
            gender: userData.gender || '',
            address: userData.address || '',
            bio: userData.bio || '',
            avatar: userData.avatar || null,
            belt: userData.belt || 'white',
            status: userData.status || 'active',
            role: userData.role || 'student',
            emailVerified: userData.emailVerified || false,
            phoneVerified: userData.phoneVerified || false,
            twoFactorEnabled: userData.twoFactorEnabled || false,
            createdAt: this.getCurrentTimestamp(),
            updatedAt: this.getCurrentTimestamp(),
            lastLogin: null
        };

        users.push(newUser);
        this.setItem('users', users);
        
        this.logAudit(null, 'user_created', 'users', newUser.id, null, newUser);
        
        return newUser;
    }

    /**
     * Get user by ID
     */
    getUserById(id) {
        const users = this.getItem('users') || [];
        return users.find(user => user.id === id);
    }

    /**
     * Get user by email
     */
    getUserByEmail(email) {
        const users = this.getItem('users') || [];
        return users.find(user => user.email === email);
    }

    /**
     * Update user
     */
    updateUser(id, updateData) {
        const users = this.getItem('users') || [];
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        const oldUser = { ...users[userIndex] };
        const updatedUser = {
            ...users[userIndex],
            ...updateData,
            updatedAt: this.getCurrentTimestamp()
        };

        users[userIndex] = updatedUser;
        this.setItem('users', users);
        
        this.logAudit(id, 'user_updated', 'users', id, oldUser, updatedUser);
        
        return updatedUser;
    }

    /**
     * Delete user
     */
    deleteUser(id) {
        const users = this.getItem('users') || [];
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        this.setItem('users', users);
        
        this.logAudit(id, 'user_deleted', 'users', id, deletedUser, null);
        
        return true;
    }

    /**
     * Get all users with optional filters
     */
    getUsers(filters = {}) {
        let users = this.getItem('users') || [];
        
        // Apply filters
        if (filters.role) {
            users = users.filter(user => user.role === filters.role);
        }
        
        if (filters.status) {
            users = users.filter(user => user.status === filters.status);
        }
        
        if (filters.belt) {
            users = users.filter(user => user.belt === filters.belt);
        }
        
        return users;
    }

    // ================================
    // CLASS MANAGEMENT
    // ================================

    /**
     * Create new class
     */
    createClass(classData) {
        const classes = this.getItem('classes') || [];
        
        const newClass = {
            id: this.generateId(),
            name: classData.name,
            description: classData.description || '',
            instructorId: classData.instructorId,
            level: classData.level,
            maxStudents: classData.maxStudents || 20,
            scheduleDay: classData.scheduleDay,
            scheduleTime: classData.scheduleTime,
            duration: classData.duration || 90,
            location: classData.location || '',
            price: classData.price || 0,
            isActive: classData.isActive !== false,
            createdAt: this.getCurrentTimestamp(),
            updatedAt: this.getCurrentTimestamp()
        };

        classes.push(newClass);
        this.setItem('classes', classes);
        
        return newClass;
    }

    /**
     * Get all classes
     */
    getClasses(filters = {}) {
        let classes = this.getItem('classes') || [];
        
        if (filters.level) {
            classes = classes.filter(cls => cls.level === filters.level);
        }
        
        if (filters.instructorId) {
            classes = classes.filter(cls => cls.instructorId === filters.instructorId);
        }
        
        if (filters.isActive !== undefined) {
            classes = classes.filter(cls => cls.isActive === filters.isActive);
        }
        
        return classes;
    }

    // ================================
    // EVENT MANAGEMENT
    // ================================

    /**
     * Create new event
     */
    createEvent(eventData) {
        const events = this.getItem('events') || [];
        
        const newEvent = {
            id: this.generateId(),
            title: eventData.title,
            description: eventData.description || '',
            eventType: eventData.eventType,
            startDate: eventData.startDate,
            endDate: eventData.endDate,
            location: eventData.location || '',
            maxParticipants: eventData.maxParticipants,
            registrationFee: eventData.registrationFee || 0,
            registrationDeadline: eventData.registrationDeadline,
            organizerId: eventData.organizerId,
            status: eventData.status || 'upcoming',
            isPublic: eventData.isPublic !== false,
            createdAt: this.getCurrentTimestamp(),
            updatedAt: this.getCurrentTimestamp()
        };

        events.push(newEvent);
        this.setItem('events', events);
        
        return newEvent;
    }

    /**
     * Get all events
     */
    getEvents(filters = {}) {
        let events = this.getItem('events') || [];
        
        if (filters.eventType) {
            events = events.filter(event => event.eventType === filters.eventType);
        }
        
        if (filters.status) {
            events = events.filter(event => event.status === filters.status);
        }
        
        return events;
    }

    // ================================
    // NOTIFICATION MANAGEMENT
    // ================================

    /**
     * Create notification
     */
    createNotification(notificationData) {
        const notifications = this.getItem('notifications') || [];
        
        const newNotification = {
            id: this.generateId(),
            userId: notificationData.userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'info',
            category: notificationData.category || 'system',
            isRead: false,
            actionUrl: notificationData.actionUrl || null,
            expiresAt: notificationData.expiresAt || null,
            createdAt: this.getCurrentTimestamp(),
            readAt: null
        };

        notifications.push(newNotification);
        this.setItem('notifications', notifications);
        
        return newNotification;
    }

    /**
     * Get user notifications
     */
    getUserNotifications(userId, unreadOnly = false) {
        const notifications = this.getItem('notifications') || [];
        let userNotifications = notifications.filter(n => n.userId === userId);
        
        if (unreadOnly) {
            userNotifications = userNotifications.filter(n => !n.isRead);
        }
        
        return userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId) {
        const notifications = this.getItem('notifications') || [];
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
            notifications[notificationIndex].isRead = true;
            notifications[notificationIndex].readAt = this.getCurrentTimestamp();
            this.setItem('notifications', notifications);
            return true;
        }
        
        return false;
    }

    // ================================
    // SYSTEM SETTINGS
    // ================================

    /**
     * Get system setting
     */
    getSystemSetting(key) {
        const settings = this.getItem('system_settings') || {};
        return settings[key];
    }

    /**
     * Set system setting
     */
    setSystemSetting(key, value) {
        const settings = this.getItem('system_settings') || {};
        settings[key] = value;
        this.setItem('system_settings', settings);
        return true;
    }

    // ================================
    // AUDIT LOGGING
    // ================================

    /**
     * Log audit trail
     */
    logAudit(userId, action, tableName, recordId, oldValues, newValues) {
        const auditLogs = this.getItem('audit_logs') || [];
        
        const auditEntry = {
            id: this.generateId(),
            userId: userId,
            action: action,
            tableName: tableName,
            recordId: recordId,
            oldValues: oldValues,
            newValues: newValues,
            ipAddress: '127.0.0.1', // In real app, get actual IP
            userAgent: navigator.userAgent,
            createdAt: this.getCurrentTimestamp()
        };

        auditLogs.push(auditEntry);
        
        // Keep only last 1000 audit entries to prevent localStorage bloat
        if (auditLogs.length > 1000) {
            auditLogs.splice(0, auditLogs.length - 1000);
        }
        
        this.setItem('audit_logs', auditLogs);
    }

    // ================================
    // DATA MANAGEMENT
    // ================================

    /**
     * Export all data
     */
    exportData() {
        const data = {};
        const keys = ['users', 'classes', 'events', 'notifications', 'system_settings'];
        
        keys.forEach(key => {
            data[key] = this.getItem(key);
        });
        
        return data;
    }

    /**
     * Import data (be careful with this!)
     */
    importData(data) {
        Object.keys(data).forEach(key => {
            this.setItem(key, data[key]);
        });
        
        console.log('Data imported successfully');
    }

    /**
     * Clear all data (for testing purposes)
     */
    clearAllData() {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
        keys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('All data cleared');
    }
}

// Initialize global database manager
window.DatabaseManager = new DatabaseManager();
