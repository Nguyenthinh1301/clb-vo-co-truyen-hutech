/**
 * Database Module Index for CLB Võ Cổ Truyền HUTECH
 * Main entry point for database operations
 * Version: 1.0
 * Created: June 30, 2025
 */

// Import all database modules
// Note: In browser environment, these would be included via script tags

/**
 * Database Initialization and Setup
 */
class DatabaseInit {
    constructor() {
        this.db = null;
        this.migrationManager = null;
        this.testSuite = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the complete database system
     */
    async initialize(options = {}) {
        try {
            console.log('🚀 Initializing CLB Võ Cổ Truyền HUTECH Database System...');

            // Initialize core database manager
            this.db = new DatabaseManager();
            console.log('✅ Database Manager initialized');

            // Initialize migration manager
            this.migrationManager = new DatabaseMigrationManager(this.db);
            console.log('✅ Migration Manager initialized');

            // Check if migration is needed
            if (this.migrationManager.needsMigration()) {
                console.log('🔄 Running database migrations...');
                const migrationResult = await this.migrationManager.runMigrations();
                
                if (migrationResult.success) {
                    console.log('✅ Database migrations completed successfully');
                } else {
                    console.error('❌ Database migration failed:', migrationResult.error);
                    throw new Error('Migration failed');
                }
            } else {
                console.log('✅ Database is up to date');
            }

            // Check database integrity
            const integrityCheck = this.migrationManager.checkIntegrity();
            if (!integrityCheck.success) {
                console.warn('⚠️ Database integrity issues detected:', integrityCheck.issues);
                
                if (options.autoRepair !== false) {
                    console.log('🔧 Auto-repairing database...');
                    const repairResult = await this.migrationManager.repairDatabase();
                    
                    if (repairResult.success) {
                        console.log('✅ Database repaired successfully');
                    } else {
                        console.error('❌ Database repair failed:', repairResult.error);
                    }
                }
            } else {
                console.log('✅ Database integrity check passed');
            }

            // Initialize test suite if in development mode
            if (options.includeTests !== false) {
                this.testSuite = new DatabaseTestSuite();
                console.log('✅ Test Suite initialized');
            }

            // Initialize sample data if database is empty
            if (options.initSampleData !== false && this.db.getUsers().length === 0) {
                console.log('📦 Initializing sample data...');
                this.db.initializeSampleData();
                console.log('✅ Sample data initialized');
            }

            this.isInitialized = true;
            console.log('🎉 Database system initialization completed successfully!');

            return {
                success: true,
                message: 'Database system initialized successfully',
                components: {
                    database: this.db,
                    migration: this.migrationManager,
                    testSuite: this.testSuite
                }
            };

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get database manager instance
     */
    getDatabase() {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized. Call initialize() first.');
        }
        return this.db;
    }

    /**
     * Get migration manager instance
     */
    getMigrationManager() {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized. Call initialize() first.');
        }
        return this.migrationManager;
    }

    /**
     * Get test suite instance
     */
    getTestSuite() {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized. Call initialize() first.');
        }
        return this.testSuite;
    }

    /**
     * Run quick health check
     */
    async healthCheck() {
        if (!this.isInitialized) {
            return {
                status: 'error',
                message: 'Database system not initialized'
            };
        }

        try {
            // Check basic operations
            const users = this.db.getUsers();
            const settings = this.db.getSystemSetting('db_version');
            const integrity = this.migrationManager.checkIntegrity();

            return {
                status: 'healthy',
                data: {
                    userCount: users.length,
                    version: settings,
                    integrity: integrity.success,
                    issues: integrity.issues || []
                }
            };

        } catch (error) {
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    /**
     * Create backup
     */
    async createBackup() {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized');
        }
        
        return this.migrationManager.createBackup();
    }

    /**
     * List all backups
     */
    listBackups() {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized');
        }
        
        return this.migrationManager.listBackups();
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(backupKey) {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized');
        }
        
        return this.migrationManager.restoreFromBackup(backupKey);
    }

    /**
     * Run tests
     */
    async runTests(testName = null) {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized');
        }

        if (!this.testSuite) {
            throw new Error('Test suite not available');
        }

        if (testName) {
            return await this.testSuite.runTest(testName);
        } else {
            return await this.testSuite.runAllTests();
        }
    }

    /**
     * Reset database to factory defaults
     */
    async reset(includeSampleData = true) {
        if (!this.isInitialized) {
            throw new Error('Database system not initialized');
        }

        try {
            console.log('🔄 Resetting database...');
            
            // Create backup before reset
            const backup = this.createBackup();
            console.log(`📦 Backup created: ${backup}`);

            // Clear all data
            this.db.clearAllData();
            console.log('🗑️ All data cleared');

            // Reinitialize
            this.db.initializeDatabase();
            
            // Add sample data if requested
            if (includeSampleData) {
                this.db.initializeSampleData();
                console.log('📦 Sample data restored');
            }

            console.log('✅ Database reset completed');
            
            return {
                success: true,
                message: 'Database reset successfully',
                backup: backup
            };

        } catch (error) {
            console.error('❌ Database reset failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get system status
     */
    getStatus() {
        if (!this.isInitialized) {
            return {
                initialized: false,
                message: 'Database system not initialized'
            };
        }

        const migrationStatus = this.migrationManager.getStatus();
        const healthCheck = this.healthCheck();

        return {
            initialized: true,
            version: migrationStatus.currentVersion,
            health: healthCheck,
            migration: migrationStatus,
            components: {
                database: !!this.db,
                migration: !!this.migrationManager,
                testSuite: !!this.testSuite
            }
        };
    }
}

// Global database instance
let globalDbInstance = null;

/**
 * Get or create global database instance
 */
function getDatabase() {
    if (!globalDbInstance) {
        globalDbInstance = new DatabaseInit();
    }
    return globalDbInstance;
}

/**
 * Initialize database system
 */
async function initializeDatabase(options = {}) {
    const dbInit = getDatabase();
    return await dbInit.initialize(options);
}

/**
 * Quick setup for development
 */
async function quickSetup() {
    console.log('🚀 Quick setup for CLB Võ Cổ Truyền HUTECH Database...');
    
    const result = await initializeDatabase({
        autoRepair: true,
        includeTests: true,
        initSampleData: true
    });

    if (result.success) {
        console.log('✅ Quick setup completed successfully!');
        console.log('🔑 Admin credentials: admin@vocotruyenhutech.edu.vn / admin123456');
        console.log('📚 Use getDatabase() to access the database instance');
        
        // Show some stats
        const db = result.components.database;
        const users = db.getUsers();
        const classes = db.getClasses();
        const events = db.getEvents();
        
        console.log(`👥 Users: ${users.length} (${users.filter(u => u.role === 'admin').length} admin, ${users.filter(u => u.role === 'instructor').length} instructors, ${users.filter(u => u.role === 'student').length} students)`);
        console.log(`📚 Classes: ${classes.length}`);
        console.log(`🎯 Events: ${events.length}`);
    } else {
        console.error('❌ Quick setup failed:', result.error);
    }

    return result;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DatabaseInit,
        getDatabase,
        initializeDatabase,
        quickSetup
    };
}

// Browser global access
if (typeof window !== 'undefined') {
    window.DatabaseSystem = {
        DatabaseInit,
        getDatabase,
        initializeDatabase,
        quickSetup
    };
}

// Usage examples and documentation
/*
==============================================================================
USAGE EXAMPLES
==============================================================================

// 1. Quick Setup (Recommended for development)
await quickSetup();

// 2. Manual Initialization
const dbInit = new DatabaseInit();
const result = await dbInit.initialize({
    autoRepair: true,      // Auto-repair database issues
    includeTests: true,    // Include test suite
    initSampleData: true   // Initialize with sample data
});

if (result.success) {
    const db = result.components.database;
    const migrationManager = result.components.migration;
    const testSuite = result.components.testSuite;
    
    // Now you can use the database
    const users = db.getUsers();
    console.log('Users:', users);
}

// 3. Using Global Instance
const dbSystem = getDatabase();
await dbSystem.initialize();

const db = dbSystem.getDatabase();
const users = db.getUsers();

// 4. Health Check
const health = await dbSystem.healthCheck();
console.log('Health status:', health);

// 5. Backup and Restore
const backupKey = await dbSystem.createBackup();
// ... later ...
await dbSystem.restoreFromBackup(backupKey);

// 6. Run Tests
await dbSystem.runTests(); // All tests
await dbSystem.runTests('user'); // Specific test

// 7. Reset Database
await dbSystem.reset(true); // Reset with sample data
await dbSystem.reset(false); // Reset without sample data

==============================================================================
BROWSER USAGE
==============================================================================

<!-- Include all database files in your HTML -->
<script src="database_manager.js"></script>
<script src="migration_manager.js"></script>
<script src="test_suite.js"></script>
<script src="index.js"></script>

<script>
// Quick setup
DatabaseSystem.quickSetup().then(result => {
    if (result.success) {
        const db = result.components.database;
        console.log('Database ready!', db.getUsers());
    }
});

// Or manual setup
const dbSystem = DatabaseSystem.getDatabase();
dbSystem.initialize().then(result => {
    if (result.success) {
        console.log('Database initialized!');
    }
});
</script>

==============================================================================
ADMIN CREDENTIALS (Development)
==============================================================================
Email: admin@vocotruyenhutech.edu.vn
Password: admin123456

==============================================================================
*/
