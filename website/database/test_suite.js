/**
 * Database Test Suite for CLB Võ Cổ Truyền HUTECH
 * Comprehensive testing for database operations
 * Version: 1.0
 * Created: June 30, 2025
 */

class DatabaseTestSuite {
    constructor() {
        this.db = new DatabaseManager();
        this.migrationManager = new DatabaseMigrationManager(this.db);
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting Database Test Suite...\n');
        
        // Clear data for clean tests
        this.db.clearAllData();
        
        try {
            // Core functionality tests
            await this.testDatabaseInitialization();
            await this.testUserManagement();
            await this.testAuthentication();
            await this.testSessionManagement();
            await this.testClassManagement();
            await this.testEventManagement();
            await this.testNotificationSystem();
            await this.testSystemSettings();
            await this.testDataIntegrity();
            await this.testMigrationSystem();
            
            // Performance tests
            await this.testPerformance();
            
            // Security tests
            await this.testSecurity();
            
        } catch (error) {
            this.addTestResult('CRITICAL', '❌', `Test suite failed: ${error.message}`);
        }
        
        this.displayResults();
    }

    /**
     * Test database initialization
     */
    async testDatabaseInitialization() {
        this.addTestResult('Database Initialization', '🔄', 'Testing database setup...');
        
        try {
            // Test initialization
            const isInitialized = this.db.getSystemSetting('db_initialized');
            this.assert(isInitialized, 'Database should be initialized');
            
            // Test version
            const version = this.db.getSystemSetting('db_version');
            this.assert(version === '1.0', 'Database version should be 1.0');
            
            // Test default data structures
            const users = this.db.getUsers();
            this.assert(Array.isArray(users), 'Users should be an array');
            
            this.addTestResult('Database Initialization', '✅', 'Database initialization OK');
            
        } catch (error) {
            this.addTestResult('Database Initialization', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test user management
     */
    async testUserManagement() {
        this.addTestResult('User Management', '🔄', 'Testing user CRUD operations...');
        
        try {
            // Test user creation
            const userData = {
                email: 'test@student.hutech.edu.vn',
                password: 'password123',
                first_name: 'Test',
                last_name: 'User',
                role: 'student',
                belt_level: 'white'
            };
            
            const result = this.db.createUser(userData);
            this.assert(result.success, 'User creation should succeed');
            
            const userId = result.data.id;
            this.assert(typeof userId === 'number', 'User ID should be a number');
            
            // Test user retrieval
            const user = this.db.getUserById(userId);
            this.assert(user !== null, 'Should retrieve created user');
            this.assert(user.email === userData.email, 'Email should match');
            
            // Test user update
            const updateResult = this.db.updateUser(userId, { first_name: 'Updated' });
            this.assert(updateResult.success, 'User update should succeed');
            
            const updatedUser = this.db.getUserById(userId);
            this.assert(updatedUser.first_name === 'Updated', 'First name should be updated');
            
            // Test user deletion
            const deleteResult = this.db.deleteUser(userId);
            this.assert(deleteResult.success, 'User deletion should succeed');
            
            const deletedUser = this.db.getUserById(userId);
            this.assert(deletedUser === null, 'Deleted user should not exist');
            
            this.addTestResult('User Management', '✅', 'User CRUD operations OK');
            
        } catch (error) {
            this.addTestResult('User Management', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test authentication
     */
    async testAuthentication() {
        this.addTestResult('Authentication', '🔄', 'Testing authentication system...');
        
        try {
            // Create test user
            const userData = {
                email: 'auth@test.com',
                password: 'testpassword123',
                first_name: 'Auth',
                last_name: 'Test',
                role: 'student'
            };
            
            const createResult = this.db.createUser(userData);
            this.assert(createResult.success, 'Test user creation should succeed');
            
            // Test correct login
            const loginResult = this.db.authenticateUser('auth@test.com', 'testpassword123');
            this.assert(loginResult.success, 'Valid login should succeed');
            this.assert(loginResult.user.email === 'auth@test.com', 'Returned user should match');
            
            // Test incorrect password
            const wrongPasswordResult = this.db.authenticateUser('auth@test.com', 'wrongpassword');
            this.assert(!wrongPasswordResult.success, 'Invalid password should fail');
            
            // Test non-existent user
            const nonExistentResult = this.db.authenticateUser('nonexistent@test.com', 'password');
            this.assert(!nonExistentResult.success, 'Non-existent user should fail');
            
            this.addTestResult('Authentication', '✅', 'Authentication system OK');
            
        } catch (error) {
            this.addTestResult('Authentication', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test session management
     */
    async testSessionManagement() {
        this.addTestResult('Session Management', '🔄', 'Testing session operations...');
        
        try {
            // Create test user
            const userData = {
                email: 'session@test.com',
                password: 'password123',
                first_name: 'Session',
                last_name: 'Test',
                role: 'student'
            };
            
            const createResult = this.db.createUser(userData);
            const userId = createResult.data.id;
            
            // Create session
            const deviceInfo = { browser: 'Chrome', os: 'Windows' };
            const sessionResult = this.db.createSession(userId, deviceInfo);
            this.assert(sessionResult.success, 'Session creation should succeed');
            
            const sessionToken = sessionResult.data.session_token;
            this.assert(typeof sessionToken === 'string', 'Session token should be string');
            
            // Verify session
            const verifyResult = this.db.verifySession(sessionToken);
            this.assert(verifyResult.success, 'Session verification should succeed');
            this.assert(verifyResult.user.id === userId, 'Session should belong to correct user');
            
            // End session
            const endResult = this.db.endSession(sessionToken);
            this.assert(endResult.success, 'Session ending should succeed');
            
            // Verify ended session
            const verifyEndedResult = this.db.verifySession(sessionToken);
            this.assert(!verifyEndedResult.success, 'Ended session should not be valid');
            
            this.addTestResult('Session Management', '✅', 'Session management OK');
            
        } catch (error) {
            this.addTestResult('Session Management', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test class management
     */
    async testClassManagement() {
        this.addTestResult('Class Management', '🔄', 'Testing class operations...');
        
        try {
            // Create instructor
            const instructorData = {
                email: 'instructor@test.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'Instructor',
                role: 'instructor'
            };
            
            const instructorResult = this.db.createUser(instructorData);
            const instructorId = instructorResult.data.id;
            
            // Create class
            const classData = {
                name: 'Test Class',
                instructor_id: instructorId,
                schedule: 'Mon, Wed, Fri - 18:00-19:30',
                max_students: 10,
                fee: 200000
            };
            
            const classResult = this.db.createClass(classData);
            this.assert(classResult.success, 'Class creation should succeed');
            
            const classId = classResult.data.id;
            
            // Create student
            const studentData = {
                email: 'student@test.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'Student',
                role: 'student'
            };
            
            const studentResult = this.db.createUser(studentData);
            const studentId = studentResult.data.id;
            
            // Enroll student
            const enrollResult = this.db.enrollUserInClass(studentId, classId);
            this.assert(enrollResult.success, 'Student enrollment should succeed');
            
            // Record attendance
            const attendanceResult = this.db.recordAttendance(classId, studentId, 'present');
            this.assert(attendanceResult.success, 'Attendance recording should succeed');
            
            // Get class details
            const classDetails = this.db.getClassById(classId);
            this.assert(classDetails !== null, 'Should retrieve class details');
            
            this.addTestResult('Class Management', '✅', 'Class management OK');
            
        } catch (error) {
            this.addTestResult('Class Management', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test event management
     */
    async testEventManagement() {
        this.addTestResult('Event Management', '🔄', 'Testing event operations...');
        
        try {
            // Create event
            const eventData = {
                name: 'Test Tournament',
                description: 'Test martial arts tournament',
                event_type: 'tournament',
                event_date: '2025-12-15',
                event_time: '09:00:00',
                location: 'HUTECH Gym',
                max_participants: 50,
                registration_fee: 100000
            };
            
            const eventResult = this.db.createEvent(eventData);
            this.assert(eventResult.success, 'Event creation should succeed');
            
            const eventId = eventResult.data.id;
            
            // Create student to register
            const studentData = {
                email: 'eventstudent@test.com',
                password: 'password123',
                first_name: 'Event',
                last_name: 'Student',
                role: 'student'
            };
            
            const studentResult = this.db.createUser(studentData);
            const studentId = studentResult.data.id;
            
            // Register for event
            const registerResult = this.db.registerForEvent(studentId, eventId);
            this.assert(registerResult.success, 'Event registration should succeed');
            
            // Get event details
            const eventDetails = this.db.getEventById(eventId);
            this.assert(eventDetails !== null, 'Should retrieve event details');
            
            this.addTestResult('Event Management', '✅', 'Event management OK');
            
        } catch (error) {
            this.addTestResult('Event Management', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test notification system
     */
    async testNotificationSystem() {
        this.addTestResult('Notification System', '🔄', 'Testing notifications...');
        
        try {
            // Create user
            const userData = {
                email: 'notify@test.com',
                password: 'password123',
                first_name: 'Notify',
                last_name: 'Test',
                role: 'student'
            };
            
            const userResult = this.db.createUser(userData);
            const userId = userResult.data.id;
            
            // Create notification
            const notificationData = {
                user_id: userId,
                title: 'Test Notification',
                message: 'This is a test notification',
                type: 'system'
            };
            
            const notifyResult = this.db.createNotification(notificationData);
            this.assert(notifyResult.success, 'Notification creation should succeed');
            
            const notificationId = notifyResult.data.id;
            
            // Get user notifications
            const notifications = this.db.getUserNotifications(userId);
            this.assert(notifications.length > 0, 'User should have notifications');
            
            // Mark as read
            const markResult = this.db.markNotificationAsRead(notificationId);
            this.assert(markResult.success, 'Marking notification as read should succeed');
            
            this.addTestResult('Notification System', '✅', 'Notification system OK');
            
        } catch (error) {
            this.addTestResult('Notification System', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test system settings
     */
    async testSystemSettings() {
        this.addTestResult('System Settings', '🔄', 'Testing system settings...');
        
        try {
            // Set setting
            this.db.setSystemSetting('test_setting', 'test_value');
            
            // Get setting
            const value = this.db.getSystemSetting('test_setting');
            this.assert(value === 'test_value', 'Setting value should match');
            
            // Update setting
            this.db.setSystemSetting('test_setting', 'updated_value');
            const updatedValue = this.db.getSystemSetting('test_setting');
            this.assert(updatedValue === 'updated_value', 'Updated setting value should match');
            
            this.addTestResult('System Settings', '✅', 'System settings OK');
            
        } catch (error) {
            this.addTestResult('System Settings', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test data integrity
     */
    async testDataIntegrity() {
        this.addTestResult('Data Integrity', '🔄', 'Testing data integrity...');
        
        try {
            // Check integrity
            const integrityResult = this.migrationManager.checkIntegrity();
            this.assert(typeof integrityResult.success === 'boolean', 'Integrity check should return success flag');
            
            // Test export/import
            const exportData = this.db.exportData();
            this.assert(typeof exportData === 'object', 'Export should return object');
            
            // Clear and import
            this.db.clearAllData();
            const importResult = this.db.importData(exportData);
            this.assert(importResult.success, 'Import should succeed');
            
            this.addTestResult('Data Integrity', '✅', 'Data integrity OK');
            
        } catch (error) {
            this.addTestResult('Data Integrity', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test migration system
     */
    async testMigrationSystem() {
        this.addTestResult('Migration System', '🔄', 'Testing migration system...');
        
        try {
            // Test migration status
            const status = this.migrationManager.getStatus();
            this.assert(typeof status === 'object', 'Migration status should be object');
            this.assert(typeof status.currentVersion === 'string', 'Current version should be string');
            
            // Test backup creation
            const backup = this.migrationManager.createBackup();
            this.assert(typeof backup === 'string', 'Backup should return backup key');
            
            // Test backup listing
            const backups = this.migrationManager.listBackups();
            this.assert(Array.isArray(backups), 'Backups should be array');
            this.assert(backups.length > 0, 'Should have at least one backup');
            
            this.addTestResult('Migration System', '✅', 'Migration system OK');
            
        } catch (error) {
            this.addTestResult('Migration System', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test performance
     */
    async testPerformance() {
        this.addTestResult('Performance Tests', '🔄', 'Testing performance...');
        
        try {
            // Test bulk user creation
            const startTime = Date.now();
            
            for (let i = 0; i < 100; i++) {
                this.db.createUser({
                    email: `perf${i}@test.com`,
                    password: 'password123',
                    first_name: `User${i}`,
                    last_name: 'Test',
                    role: 'student'
                });
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            this.assert(duration < 5000, 'Bulk creation should complete in under 5 seconds');
            
            // Test bulk retrieval
            const retrievalStart = Date.now();
            const users = this.db.getUsers();
            const retrievalEnd = Date.now();
            const retrievalDuration = retrievalEnd - retrievalStart;
            
            this.assert(users.length >= 100, 'Should retrieve all created users');
            this.assert(retrievalDuration < 1000, 'Bulk retrieval should complete in under 1 second');
            
            this.addTestResult('Performance Tests', '✅', `Performance OK (Create: ${duration}ms, Retrieve: ${retrievalDuration}ms)`);
            
        } catch (error) {
            this.addTestResult('Performance Tests', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Test security features
     */
    async testSecurity() {
        this.addTestResult('Security Tests', '🔄', 'Testing security features...');
        
        try {
            // Test SQL injection prevention (basic)
            const maliciousEmail = "'; DROP TABLE users; --";
            const result = this.db.getUserByEmail(maliciousEmail);
            this.assert(result === null, 'Should handle malicious input safely');
            
            // Test empty/null input handling
            const nullResult = this.db.createUser(null);
            this.assert(!nullResult.success, 'Should reject null input');
            
            const emptyResult = this.db.createUser({});
            this.assert(!emptyResult.success, 'Should reject empty input');
            
            // Test duplicate email prevention
            const userData = {
                email: 'duplicate@test.com',
                password: 'password123',
                first_name: 'Test',
                last_name: 'User',
                role: 'student'
            };
            
            const firstUser = this.db.createUser(userData);
            this.assert(firstUser.success, 'First user creation should succeed');
            
            const duplicateUser = this.db.createUser(userData);
            this.assert(!duplicateUser.success, 'Duplicate email should be rejected');
            
            this.addTestResult('Security Tests', '✅', 'Security features OK');
            
        } catch (error) {
            this.addTestResult('Security Tests', '❌', `Failed: ${error.message}`);
        }
    }

    /**
     * Add test result
     */
    addTestResult(category, status, message) {
        const result = {
            category,
            status,
            message,
            timestamp: new Date().toLocaleTimeString()
        };
        
        this.testResults.push(result);
        
        if (status === '✅') {
            this.passedTests++;
        } else if (status === '❌') {
            this.failedTests++;
        }
        
        console.log(`${status} ${category}: ${message}`);
    }

    /**
     * Assert function for tests
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Display test results
     */
    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 DATABASE TEST RESULTS');
        console.log('='.repeat(60));
        
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📊 Total: ${this.passedTests + this.failedTests}`);
        console.log(`📈 Success Rate: ${Math.round((this.passedTests / (this.passedTests + this.failedTests)) * 100)}%`);
        
        if (this.failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults
                .filter(r => r.status === '❌')
                .forEach(r => console.log(`   ${r.category}: ${r.message}`));
        }
        
        console.log('\n📋 DETAILED RESULTS:');
        this.testResults.forEach(result => {
            console.log(`${result.status} [${result.timestamp}] ${result.category}: ${result.message}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        if (this.failedTests === 0) {
            console.log('🎉 All tests passed! Database system is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the issues above.');
        }
        
        console.log('='.repeat(60));
    }

    /**
     * Run specific test
     */
    async runTest(testName) {
        console.log(`🧪 Running specific test: ${testName}\n`);
        
        this.db.clearAllData();
        
        switch (testName.toLowerCase()) {
            case 'user':
                await this.testUserManagement();
                break;
            case 'auth':
                await this.testAuthentication();
                break;
            case 'session':
                await this.testSessionManagement();
                break;
            case 'class':
                await this.testClassManagement();
                break;
            case 'event':
                await this.testEventManagement();
                break;
            case 'notification':
                await this.testNotificationSystem();
                break;
            case 'performance':
                await this.testPerformance();
                break;
            case 'security':
                await this.testSecurity();
                break;
            default:
                console.log('❌ Unknown test name. Available tests: user, auth, session, class, event, notification, performance, security');
                return;
        }
        
        this.displayResults();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseTestSuite;
}

// Usage examples:
/*
// Run all tests
const testSuite = new DatabaseTestSuite();
testSuite.runAllTests();

// Run specific test
testSuite.runTest('user');

// Quick test
function quickTest() {
    const testSuite = new DatabaseTestSuite();
    testSuite.runAllTests();
}
*/
