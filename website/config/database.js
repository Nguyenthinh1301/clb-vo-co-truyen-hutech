/**
 * Database Configuration for CLB Võ Cổ Truyền HUTECH Website
 * This file contains database setup, schemas, and utility functions
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'CLB_VoCo_HUTECH_DB';
        this.version = 1;
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize IndexedDB database
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                this.db = e.target.result;
                console.log('Database upgrade needed, creating object stores...');
                this.createObjectStores();
            };
        });
    }

    /**
     * Create object stores (tables)
     */
    createObjectStores() {
        // Users table
        if (!this.db.objectStoreNames.contains('users')) {
            const usersStore = this.db.createObjectStore('users', { keyPath: 'id' });
            usersStore.createIndex('email', 'email', { unique: true });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('role', 'role', { unique: false });
            usersStore.createIndex('membershipStatus', 'membershipStatus', { unique: false });
        }

        // Training sessions table
        if (!this.db.objectStoreNames.contains('trainingSessions')) {
            const sessionsStore = this.db.createObjectStore('trainingSessions', { keyPath: 'id' });
            sessionsStore.createIndex('userId', 'userId', { unique: false });
            sessionsStore.createIndex('date', 'date', { unique: false });
            sessionsStore.createIndex('instructor', 'instructor', { unique: false });
        }

        // Achievements table
        if (!this.db.objectStoreNames.contains('achievements')) {
            const achievementsStore = this.db.createObjectStore('achievements', { keyPath: 'id' });
            achievementsStore.createIndex('userId', 'userId', { unique: false });
            achievementsStore.createIndex('type', 'type', { unique: false });
            achievementsStore.createIndex('dateEarned', 'dateEarned', { unique: false });
        }

        // Events table
        if (!this.db.objectStoreNames.contains('events')) {
            const eventsStore = this.db.createObjectStore('events', { keyPath: 'id' });
            eventsStore.createIndex('date', 'date', { unique: false });
            eventsStore.createIndex('type', 'type', { unique: false });
            eventsStore.createIndex('status', 'status', { unique: false });
        }

        // Attendance table
        if (!this.db.objectStoreNames.contains('attendance')) {
            const attendanceStore = this.db.createObjectStore('attendance', { keyPath: 'id' });
            attendanceStore.createIndex('userId', 'userId', { unique: false });
            attendanceStore.createIndex('sessionId', 'sessionId', { unique: false });
            attendanceStore.createIndex('date', 'date', { unique: false });
        }

        // Contact messages table
        if (!this.db.objectStoreNames.contains('contactMessages')) {
            const messagesStore = this.db.createObjectStore('contactMessages', { keyPath: 'id' });
            messagesStore.createIndex('email', 'email', { unique: false });
            messagesStore.createIndex('date', 'date', { unique: false });
            messagesStore.createIndex('status', 'status', { unique: false });
        }
    }

    /**
     * Generic CRUD operations
     */

    // Create
    async create(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Generate ID if not provided
            if (!data.id) {
                data.id = this.generateId();
            }
            
            const request = store.add(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    // Read
    async read(storeName, id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Update
    async update(storeName, data) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete
    async delete(storeName, id) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all records
    async getAll(storeName) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Query by index
    async queryByIndex(storeName, indexName, value) {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * User-specific operations
     */

    async createUser(userData) {
        const user = {
            id: this.generateId(),
            username: userData.username,
            email: userData.email,
            password: userData.password, // Should be hashed in production
            fullName: userData.fullName,
            phoneNumber: userData.phoneNumber || '',
            dateOfBirth: userData.dateOfBirth || '',
            role: userData.role || 'student',
            membershipStatus: userData.membershipStatus || 'pending',
            joinDate: userData.joinDate || new Date().toISOString(),
            lastLoginDate: null,
            profileImage: userData.profileImage || '',
            address: userData.address || '',
            emergencyContact: userData.emergencyContact || '',
            medicalInfo: userData.medicalInfo || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return this.create('users', user);
    }

    async getUserByEmail(email) {
        const users = await this.queryByIndex('users', 'email', email);
        return users.length > 0 ? users[0] : null;
    }

    async getUserByUsername(username) {
        const users = await this.queryByIndex('users', 'username', username);
        return users.length > 0 ? users[0] : null;
    }

    async validateLogin(emailOrUsername, password) {
        const userByEmail = await this.getUserByEmail(emailOrUsername);
        const userByUsername = await this.getUserByUsername(emailOrUsername);
        
        const user = userByEmail || userByUsername;
        
        if (user && user.password === password) {
            // Update last login date
            user.lastLoginDate = new Date().toISOString();
            await this.update('users', user);
            return { success: true, user: user };
        }
        
        return { success: false, message: 'Invalid credentials' };
    }

    /**
     * Training session operations
     */

    async createTrainingSession(sessionData) {
        const session = {
            id: this.generateId(),
            title: sessionData.title,
            description: sessionData.description || '',
            date: sessionData.date,
            startTime: sessionData.startTime,
            endTime: sessionData.endTime,
            instructor: sessionData.instructor,
            maxParticipants: sessionData.maxParticipants || 20,
            currentParticipants: 0,
            location: sessionData.location || 'Phòng tập CLB',
            type: sessionData.type || 'regular', // regular, competition, seminar
            status: sessionData.status || 'scheduled', // scheduled, ongoing, completed, cancelled
            createdAt: new Date().toISOString()
        };

        return this.create('trainingSessions', session);
    }

    async getUpcomingSessions(limit = 10) {
        const allSessions = await this.getAll('trainingSessions');
        const now = new Date();
        
        return allSessions
            .filter(session => new Date(session.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    }

    /**
     * Achievement operations
     */

    async createAchievement(achievementData) {
        const achievement = {
            id: this.generateId(),
            userId: achievementData.userId,
            title: achievementData.title,
            description: achievementData.description,
            type: achievementData.type, // attendance, performance, competition, etc.
            icon: achievementData.icon || 'fas fa-trophy',
            points: achievementData.points || 0,
            dateEarned: achievementData.dateEarned || new Date().toISOString(),
            isVisible: achievementData.isVisible !== false
        };

        return this.create('achievements', achievement);
    }

    async getUserAchievements(userId) {
        return this.queryByIndex('achievements', 'userId', userId);
    }

    /**
     * Contact message operations
     */

    async createContactMessage(messageData) {
        const message = {
            id: this.generateId(),
            name: messageData.name,
            email: messageData.email,
            phone: messageData.phone || '',
            subject: messageData.subject || 'Liên hệ từ website',
            message: messageData.message,
            status: 'new', // new, read, replied, archived
            date: new Date().toISOString(),
            adminNotes: ''
        };

        return this.create('contactMessages', message);
    }

    /**
     * Utility functions
     */

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async clearAllData() {
        await this.init();
        const storeNames = ['users', 'trainingSessions', 'achievements', 'events', 'attendance', 'contactMessages'];
        
        for (const storeName of storeNames) {
            if (this.db.objectStoreNames.contains(storeName)) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                await store.clear();
            }
        }
        
        console.log('All data cleared from database');
    }

    /**
     * Seed initial data
     */

    async seedInitialData() {
        try {
            // Check if data already exists
            const existingUsers = await this.getAll('users');
            if (existingUsers.length > 0) {
                console.log('Database already has data, skipping seed');
                return;
            }

            console.log('Seeding initial data...');

            // Create admin user
            await this.createUser({
                username: 'admin',
                email: 'admin@hutech.edu.vn',
                password: 'admin123',
                fullName: 'Quản trị viên CLB',
                role: 'admin',
                membershipStatus: 'active',
                phoneNumber: '0909123456'
            });

            // Create instructor user
            await this.createUser({
                username: 'instructor1',
                email: 'instructor@hutech.edu.vn',
                password: 'instructor123',
                fullName: 'Huấn luyện viên Nguyễn Văn A',
                role: 'instructor',
                membershipStatus: 'active',
                phoneNumber: '0909234567'
            });

            // Create sample students
            await this.createUser({
                username: 'student1',
                email: 'student1@hutech.edu.vn',
                password: 'student123',
                fullName: 'Nguyễn Thị B',
                role: 'student',
                membershipStatus: 'active',
                phoneNumber: '0909345678'
            });

       
            // Create sample training sessions
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            await this.createTrainingSession({
                title: 'Luyện tập cơ bản',
                description: 'Buổi tập luyện các động tác cơ bản của võ cổ truyền',
                date: tomorrow.toISOString().split('T')[0],
                startTime: '18:00',
                endTime: '20:00',
                instructor: 'Huấn luyện viên Nguyễn Văn A',
                maxParticipants: 25,
                type: 'regular'
            });

            await this.createTrainingSession({
                title: 'Thi đấu nội bộ',
                description: 'Giải thi đấu nội bộ CLB',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                startTime: '14:00',
                endTime: '17:00',
                instructor: 'Huấn luyện viên Nguyễn Văn A',
                maxParticipants: 20,
                type: 'competition'
            });

            console.log('Initial data seeded successfully');
        } catch (error) {
            console.error('Error seeding initial data:', error);
        }
    }

    /**
     * Export data for backup
     */
    async exportData() {
        await this.init();
        const data = {};
        const storeNames = ['users', 'trainingSessions', 'achievements', 'events', 'attendance', 'contactMessages'];
        
        for (const storeName of storeNames) {
            if (this.db.objectStoreNames.contains(storeName)) {
                data[storeName] = await this.getAll(storeName);
            }
        }
        
        return data;
    }

    /**
     * Import data from backup
     */
    async importData(data) {
        await this.init();
        
        for (const [storeName, records] of Object.entries(data)) {
            if (this.db.objectStoreNames.contains(storeName) && Array.isArray(records)) {
                for (const record of records) {
                    await this.create(storeName, record);
                }
            }
        }
        
        console.log('Data imported successfully');
    }
}

// Create global database instance
const DB = new DatabaseManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseManager;
} else {
    window.DatabaseManager = DatabaseManager;
    window.DB = DB;
}

// Auto-initialize database when loaded
DB.init().then(() => {
    console.log('Database initialized successfully');
    // Seed initial data if needed
    DB.seedInitialData();
}).catch(error => {
    console.error('Failed to initialize database:', error);
});
