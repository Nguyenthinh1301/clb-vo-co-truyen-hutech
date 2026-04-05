/**
 * Database Migration Manager for CLB Võ Cổ Truyền HUTECH
 * Handles database version updates and data migrations
 * Version: 1.0
 * Created: June 30, 2025
 */

class DatabaseMigrationManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.currentVersion = '1.0';
        this.migrations = new Map();
        this.setupMigrations();
    }

    /**
     * Setup all available migrations
     */
    setupMigrations() {
        // Migration from initial setup to v1.0
        this.migrations.set('1.0', {
            version: '1.0',
            description: 'Initial database setup',
            up: () => this.migrateToV1_0(),
            down: () => this.rollbackFromV1_0()
        });

        // Future migrations can be added here
        // this.migrations.set('1.1', {
        //     version: '1.1',
        //     description: 'Add new features',
        //     up: () => this.migrateToV1_1(),
        //     down: () => this.rollbackFromV1_1()
        // });
    }

    /**
     * Check if migration is needed
     */
    needsMigration() {
        const currentDbVersion = this.db.getSystemSetting('db_version') || '0.0';
        return this.compareVersions(currentDbVersion, this.currentVersion) < 0;
    }

    /**
     * Get database version
     */
    getDatabaseVersion() {
        return this.db.getSystemSetting('db_version') || '0.0';
    }

    /**
     * Run all pending migrations
     */
    async runMigrations() {
        try {
            const currentDbVersion = this.getDatabaseVersion();
            console.log(`Current database version: ${currentDbVersion}`);
            
            if (!this.needsMigration()) {
                console.log('Database is up to date');
                return { success: true, message: 'Database is up to date' };
            }

            // Create backup before migration
            const backup = this.createBackup();
            console.log('Backup created before migration');

            // Run migrations in order
            const migrationsToRun = this.getMigrationsToRun(currentDbVersion);
            
            for (const migration of migrationsToRun) {
                console.log(`Running migration ${migration.version}: ${migration.description}`);
                
                try {
                    await migration.up();
                    this.db.setSystemSetting('db_version', migration.version);
                    console.log(`Migration ${migration.version} completed successfully`);
                } catch (error) {
                    console.error(`Migration ${migration.version} failed:`, error);
                    // Rollback on failure
                    await this.rollbackMigration(migration.version);
                    throw new Error(`Migration ${migration.version} failed: ${error.message}`);
                }
            }

            console.log(`Database migrated successfully to version ${this.currentVersion}`);
            return { 
                success: true, 
                message: `Database migrated to version ${this.currentVersion}`,
                backup: backup
            };

        } catch (error) {
            console.error('Migration failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * Get list of migrations to run
     */
    getMigrationsToRun(currentVersion) {
        const migrationsToRun = [];
        
        for (const [version, migration] of this.migrations) {
            if (this.compareVersions(currentVersion, version) < 0) {
                migrationsToRun.push(migration);
            }
        }

        // Sort by version
        return migrationsToRun.sort((a, b) => 
            this.compareVersions(a.version, b.version)
        );
    }

    /**
     * Compare two version strings
     */
    compareVersions(version1, version2) {
        const v1Parts = version1.split('.').map(Number);
        const v2Parts = version2.split('.').map(Number);
        
        const maxLength = Math.max(v1Parts.length, v2Parts.length);
        
        for (let i = 0; i < maxLength; i++) {
            const v1Part = v1Parts[i] || 0;
            const v2Part = v2Parts[i] || 0;
            
            if (v1Part < v2Part) return -1;
            if (v1Part > v2Part) return 1;
        }
        
        return 0;
    }

    /**
     * Create backup of current data
     */
    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `backup_${timestamp}`;
        const backupData = this.db.exportData();
        
        localStorage.setItem(backupKey, JSON.stringify({
            version: this.getDatabaseVersion(),
            timestamp: timestamp,
            data: backupData
        }));
        
        return backupKey;
    }

    /**
     * Restore from backup
     */
    restoreFromBackup(backupKey) {
        try {
            const backupJson = localStorage.getItem(backupKey);
            if (!backupJson) {
                throw new Error('Backup not found');
            }
            
            const backup = JSON.parse(backupJson);
            this.db.importData(backup.data);
            this.db.setSystemSetting('db_version', backup.version);
            
            console.log(`Database restored from backup: ${backupKey}`);
            return { success: true, message: 'Database restored successfully' };
        } catch (error) {
            console.error('Restore failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * List all available backups
     */
    listBackups() {
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('backup_')) {
                try {
                    const backupJson = localStorage.getItem(key);
                    const backup = JSON.parse(backupJson);
                    backups.push({
                        key: key,
                        version: backup.version,
                        timestamp: backup.timestamp,
                        date: new Date(backup.timestamp).toLocaleString('vi-VN')
                    });
                } catch (error) {
                    console.warn(`Invalid backup format: ${key}`);
                }
            }
        }
        
        return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Delete old backups (keep only last 5)
     */
    cleanupBackups() {
        const backups = this.listBackups();
        const backupsToDelete = backups.slice(5); // Keep only last 5
        
        backupsToDelete.forEach(backup => {
            localStorage.removeItem(backup.key);
            console.log(`Deleted old backup: ${backup.key}`);
        });
        
        return backupsToDelete.length;
    }

    /**
     * Migration to version 1.0
     */
    async migrateToV1_0() {
        console.log('Migrating to version 1.0...');
        
        // Initialize sample data if not exists
        if (!this.db.getUsers().length) {
            this.db.initializeSampleData();
        }
        
        // Add any missing system settings
        const requiredSettings = {
            'site_name': 'CLB Võ Cổ Truyền HUTECH',
            'max_login_attempts': '5',
            'session_timeout': '86400',
            'otp_expiry_minutes': '5',
            'enable_registration': 'true',
            'enable_two_factor': 'false'
        };
        
        for (const [key, value] of Object.entries(requiredSettings)) {
            if (!this.db.getSystemSetting(key)) {
                this.db.setSystemSetting(key, value);
            }
        }
        
        console.log('Migration to v1.0 completed');
    }

    /**
     * Rollback from version 1.0
     */
    async rollbackFromV1_0() {
        console.log('Rolling back from version 1.0...');
        
        // Clear all data for rollback
        this.db.clearAllData();
        
        console.log('Rollback from v1.0 completed');
    }

    /**
     * Rollback a specific migration
     */
    async rollbackMigration(version) {
        const migration = this.migrations.get(version);
        if (migration && migration.down) {
            console.log(`Rolling back migration ${version}`);
            await migration.down();
        }
    }

    /**
     * Check database integrity
     */
    checkIntegrity() {
        const issues = [];
        
        try {
            // Check if essential tables exist
            const users = this.db.getUsers();
            const classes = this.db.getClasses();
            const events = this.db.getEvents();
            
            // Check admin user exists
            const adminUsers = users.filter(u => u.role === 'admin');
            if (adminUsers.length === 0) {
                issues.push('No admin user found');
            }
            
            // Check data consistency
            const enrollments = this.db.getAllData('class_enrollments') || [];
            for (const enrollment of enrollments) {
                const user = users.find(u => u.id === enrollment.user_id);
                const cls = classes.find(c => c.id === enrollment.class_id);
                
                if (!user) {
                    issues.push(`Enrollment references non-existent user: ${enrollment.user_id}`);
                }
                if (!cls) {
                    issues.push(`Enrollment references non-existent class: ${enrollment.class_id}`);
                }
            }
            
            // Check system settings
            const requiredSettings = [
                'db_version', 'site_name', 'max_login_attempts', 
                'session_timeout', 'enable_registration'
            ];
            
            for (const setting of requiredSettings) {
                if (!this.db.getSystemSetting(setting)) {
                    issues.push(`Missing system setting: ${setting}`);
                }
            }
            
        } catch (error) {
            issues.push(`Database integrity check failed: ${error.message}`);
        }
        
        return {
            success: issues.length === 0,
            issues: issues,
            message: issues.length === 0 ? 'Database integrity OK' : `Found ${issues.length} issues`
        };
    }

    /**
     * Repair database issues
     */
    async repairDatabase() {
        console.log('Starting database repair...');
        
        const integrityCheck = this.checkIntegrity();
        if (integrityCheck.success) {
            return { success: true, message: 'Database is healthy, no repair needed' };
        }
        
        // Create backup before repair
        const backup = this.createBackup();
        
        try {
            // Repair missing admin user
            const users = this.db.getUsers();
            const adminUsers = users.filter(u => u.role === 'admin');
            if (adminUsers.length === 0) {
                const adminUser = {
                    email: 'admin@vocotruyenhutech.edu.vn',
                    password: 'admin123456',
                    first_name: 'Quản trị',
                    last_name: 'Viên',
                    role: 'admin',
                    status: 'active',
                    email_verified: true,
                    belt_level: 'black'
                };
                this.db.createUser(adminUser);
                console.log('Created missing admin user');
            }
            
            // Remove orphaned enrollments
            const enrollments = this.db.getAllData('class_enrollments') || [];
            const classes = this.db.getClasses();
            const validEnrollments = enrollments.filter(enrollment => {
                const user = users.find(u => u.id === enrollment.user_id);
                const cls = classes.find(c => c.id === enrollment.class_id);
                return user && cls;
            });
            
            if (validEnrollments.length !== enrollments.length) {
                this.db.setAllData('class_enrollments', validEnrollments);
                console.log(`Removed ${enrollments.length - validEnrollments.length} orphaned enrollments`);
            }
            
            // Add missing system settings
            const requiredSettings = {
                'db_version': this.currentVersion,
                'site_name': 'CLB Võ Cổ Truyền HUTECH',
                'max_login_attempts': '5',
                'session_timeout': '86400',
                'enable_registration': 'true'
            };
            
            for (const [key, value] of Object.entries(requiredSettings)) {
                if (!this.db.getSystemSetting(key)) {
                    this.db.setSystemSetting(key, value);
                }
            }
            
            console.log('Database repair completed successfully');
            return { 
                success: true, 
                message: 'Database repaired successfully',
                backup: backup
            };
            
        } catch (error) {
            console.error('Database repair failed:', error);
            return { 
                success: false, 
                error: error.message,
                backup: backup
            };
        }
    }

    /**
     * Get migration status
     */
    getStatus() {
        return {
            currentVersion: this.getDatabaseVersion(),
            targetVersion: this.currentVersion,
            needsMigration: this.needsMigration(),
            availableMigrations: Array.from(this.migrations.keys()),
            integrityCheck: this.checkIntegrity(),
            backupCount: this.listBackups().length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseMigrationManager;
}

// Usage example:
/*
const db = new DatabaseManager();
const migrationManager = new DatabaseMigrationManager(db);

// Check if migration is needed
if (migrationManager.needsMigration()) {
    console.log('Database migration required');
    migrationManager.runMigrations().then(result => {
        if (result.success) {
            console.log('Migration completed successfully');
        } else {
            console.error('Migration failed:', result.error);
        }
    });
}

// Check database status
const status = migrationManager.getStatus();
console.log('Database status:', status);

// Manual repair if needed
if (!status.integrityCheck.success) {
    migrationManager.repairDatabase().then(result => {
        console.log('Repair result:', result);
    });
}
*/
