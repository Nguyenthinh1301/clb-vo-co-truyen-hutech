/**
 * MSSQL Database Manager
 * Script quản lý và tối ưu hóa SQL Server
 */

require('dotenv').config();
const db = require('../config/db');
const MSSQLSchemaManager = require('../database/mssql-schema-manager');
const { MSSQLPerformanceService } = require('../services/mssqlPerformanceService');

class MSSQLManager {
  constructor() {
    this.schemaManager = new MSSQLSchemaManager();
    this.performanceService = new MSSQLPerformanceService();
  }

  async showMenu() {
    console.log('\n🔧 MSSQL Database Manager');
    console.log('========================');
    console.log('1. Check Database Status');
    console.log('2. Run Migrations');
    console.log('3. Performance Report');
    console.log('4. Optimize Database');
    console.log('5. Backup Schema');
    console.log('6. Database Statistics');
    console.log('7. Connection Test');
    console.log('8. Create Migration');
    console.log('9. Rollback Last Migration');
    console.log('0. Exit');
    console.log('========================');
  }

  async handleChoice(choice) {
    switch (choice) {
      case '1':
        await this.checkDatabaseStatus();
        break;
      case '2':
        await this.runMigrations();
        break;
      case '3':
        await this.showPerformanceReport();
        break;
      case '4':
        await this.optimizeDatabase();
        break;
      case '5':
        await this.backupSchema();
        break;
      case '6':
        await this.showDatabaseStats();
        break;
      case '7':
        await this.testConnection();
        break;
      case '8':
        await this.createMigration();
        break;
      case '9':
        await this.rollbackMigration();
        break;
      case '0':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice. Please try again.');
    }
  }

  async checkDatabaseStatus() {
    try {
      console.log('\n📊 Checking Database Status...');
      
      const status = await this.schemaManager.checkDatabaseStatus();
      
      console.log('✅ Database Status:');
      console.log(`   Database: ${status.database}`);
      console.log(`   Tables: ${status.tables}`);
      console.log(`   Procedures: ${status.procedures}`);
      console.log(`   Views: ${status.views}`);
      console.log(`   Migrations: ${status.migrations}`);
      
      // Health check
      const health = await this.performanceService.checkHealth();
      console.log(`\n🏥 Health Status: ${health.status.toUpperCase()}`);
      
      if (health.issues?.length > 0) {
        console.log('⚠️  Issues:');
        health.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (health.recommendations?.length > 0) {
        console.log('💡 Recommendations:');
        health.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
      
    } catch (error) {
      console.log('❌ Error checking database status:', error.message);
    }
  }

  async runMigrations() {
    try {
      console.log('\n🔄 Running Migrations...');
      await this.schemaManager.runMigrations();
      console.log('✅ Migrations completed successfully!');
    } catch (error) {
      console.log('❌ Error running migrations:', error.message);
    }
  }

  async showPerformanceReport() {
    try {
      console.log('\n📈 Generating Performance Report...');
      
      await this.performanceService.collectMetrics();
      const report = this.performanceService.generatePerformanceReport();
      
      console.log('✅ Performance Report:');
      console.log(`   Database: ${report.summary.database}`);
      console.log(`   Active Connections: ${report.summary.activeConnections}`);
      console.log(`   Last Check: ${report.summary.lastCheck}`);
      
      if (report.performance.slowQueries?.length > 0) {
        console.log('\n🐌 Slowest Queries:');
        report.performance.slowQueries.forEach((query, index) => {
          console.log(`   ${index + 1}. Avg Time: ${Math.round(query.avg_elapsed_time)}ms`);
          console.log(`      Executions: ${query.execution_count}`);
          console.log(`      Query: ${query.query_text?.substring(0, 100)}...`);
        });
      }
      
      if (report.resources.databaseSize) {
        const size = report.resources.databaseSize[0];
        console.log('\n💾 Database Size:');
        console.log(`   Used: ${Math.round(size.used_space_mb)}MB`);
        console.log(`   Allocated: ${Math.round(size.allocated_space_mb)}MB`);
        console.log(`   Free: ${Math.round(size.free_space_mb)}MB`);
      }
      
    } catch (error) {
      console.log('❌ Error generating performance report:', error.message);
    }
  }

  async optimizeDatabase() {
    try {
      console.log('\n⚡ Optimizing Database...');
      
      const optimizations = await this.performanceService.optimizeDatabase();
      
      console.log('✅ Optimization completed:');
      optimizations.forEach(opt => console.log(`   - ${opt}`));
      
    } catch (error) {
      console.log('❌ Error optimizing database:', error.message);
    }
  }

  async backupSchema() {
    try {
      console.log('\n💾 Backing up Schema...');
      
      const backupPath = await this.schemaManager.backupSchema();
      
      console.log(`✅ Schema backup created: ${backupPath}`);
      
    } catch (error) {
      console.log('❌ Error backing up schema:', error.message);
    }
  }

  async showDatabaseStats() {
    try {
      console.log('\n📊 Database Statistics...');
      
      const stats = await db.getDatabaseStats();
      
      console.log('✅ Statistics:');
      Object.entries(stats).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      // Table list
      const tables = await db.query(`
        SELECT TABLE_NAME, 
               (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as column_count
        FROM INFORMATION_SCHEMA.TABLES t
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
      
      console.log('\n📋 Tables:');
      tables[0].forEach(table => {
        console.log(`   ${table.TABLE_NAME} (${table.column_count} columns)`);
      });
      
    } catch (error) {
      console.log('❌ Error getting database statistics:', error.message);
    }
  }

  async testConnection() {
    try {
      console.log('\n🔌 Testing Connection...');
      
      const start = Date.now();
      const result = await db.query('SELECT @@VERSION as version, GETDATE() as server_time');
      const duration = Date.now() - start;
      
      console.log('✅ Connection successful!');
      console.log(`   Response time: ${duration}ms`);
      console.log(`   Server time: ${result[0][0].server_time}`);
      console.log(`   Version: ${result[0][0].version.split('\n')[0]}`);
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
    }
  }

  async createMigration() {
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const name = await new Promise(resolve => {
        readline.question('\n📝 Migration name: ', resolve);
      });

      const content = await new Promise(resolve => {
        readline.question('📄 SQL content (or press Enter for template): ', resolve);
      });

      readline.close();

      const migrationContent = content || `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your SQL statements here
-- Example:
-- CREATE TABLE example (
--   id INT IDENTITY(1,1) PRIMARY KEY,
--   name NVARCHAR(255) NOT NULL,
--   created_at DATETIME2 DEFAULT GETDATE()
-- );

GO`;

      const filename = await this.schemaManager.createMigration(name, migrationContent);
      console.log(`✅ Migration created: ${filename}`);
      
    } catch (error) {
      console.log('❌ Error creating migration:', error.message);
    }
  }

  async rollbackMigration() {
    try {
      console.log('\n↩️  Rolling back last migration...');
      
      const rolledBack = await this.schemaManager.rollbackLastMigration();
      
      if (rolledBack) {
        console.log(`✅ Rolled back migration: ${rolledBack}`);
      } else {
        console.log('ℹ️  No migrations to rollback');
      }
      
    } catch (error) {
      console.log('❌ Error rolling back migration:', error.message);
    }
  }

  async run() {
    console.log('🚀 Starting MSSQL Manager...');
    
    // Test connection first
    try {
      await db.query('SELECT 1');
      console.log('✅ Database connection verified');
    } catch (error) {
      console.log('❌ Database connection failed:', error.message);
      process.exit(1);
    }

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    while (true) {
      await this.showMenu();
      
      const choice = await new Promise(resolve => {
        readline.question('\nSelect option: ', resolve);
      });

      await this.handleChoice(choice.trim());
      
      if (choice === '0') break;
      
      // Pause before showing menu again
      await new Promise(resolve => {
        readline.question('\nPress Enter to continue...', resolve);
      });
    }

    readline.close();
  }
}

// Run if called directly
if (require.main === module) {
  const manager = new MSSQLManager();
  manager.run().catch(console.error);
}

module.exports = MSSQLManager;