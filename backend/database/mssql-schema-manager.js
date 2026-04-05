/**
 * MSSQL Schema Manager
 * Quản lý schema và migration cho SQL Server
 */

const db = require('../config/db');
const logger = require('../services/loggerService');
const fs = require('fs').promises;
const path = require('path');

class MSSQLSchemaManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  /**
   * Tạo bảng migrations nếu chưa có
   */
  async createMigrationsTable() {
    try {
      const sql = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='migrations' AND xtype='U')
        CREATE TABLE migrations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          migration_name NVARCHAR(255) NOT NULL UNIQUE,
          executed_at DATETIME2 DEFAULT GETDATE(),
          checksum NVARCHAR(64)
        )
      `;
      
      await db.query(sql);
      logger.info('Migrations table created or verified');
      
    } catch (error) {
      logger.error('Error creating migrations table:', error);
      throw error;
    }
  }

  /**
   * Chạy tất cả migrations chưa thực hiện
   */
  async runMigrations() {
    try {
      await this.createMigrationsTable();
      
      // Lấy danh sách migrations đã chạy
      const executedMigrations = await db.query('SELECT migration_name FROM migrations');
      const executedNames = executedMigrations[0].map(m => m.migration_name);
      
      // Lấy danh sách file migrations
      const migrationFiles = await this.getMigrationFiles();
      
      // Chạy migrations chưa thực hiện
      for (const file of migrationFiles) {
        if (!executedNames.includes(file.name)) {
          await this.runMigration(file);
        }
      }
      
      logger.info('All migrations completed successfully');
      
    } catch (error) {
      logger.error('Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Chạy một migration cụ thể
   */
  async runMigration(migrationFile) {
    try {
      logger.info(`Running migration: ${migrationFile.name}`);
      
      const sqlContent = await fs.readFile(migrationFile.path, 'utf8');
      
      // Tách các statements bằng GO
      const statements = sqlContent
        .split(/\bGO\b/i)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Thực hiện từng statement
      for (const statement of statements) {
        if (statement.trim()) {
          await db.query(statement);
        }
      }
      
      // Ghi nhận migration đã thực hiện
      await db.query(
        'INSERT INTO migrations (migration_name) VALUES (?)',
        [migrationFile.name]
      );
      
      logger.info(`Migration completed: ${migrationFile.name}`);
      
    } catch (error) {
      logger.error(`Error running migration ${migrationFile.name}:`, error);
      throw error;
    }
  }

  /**
   * Lấy danh sách file migrations
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          name: file,
          path: path.join(this.migrationsPath, file)
        }));
        
    } catch (error) {
      logger.warn('Migrations directory not found, creating...');
      await fs.mkdir(this.migrationsPath, { recursive: true });
      return [];
    }
  }

  /**
   * Tạo migration mới
   */
  async createMigration(name, content) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${timestamp}_${name}.sql`;
      const filepath = path.join(this.migrationsPath, filename);
      
      await fs.writeFile(filepath, content, 'utf8');
      
      logger.info(`Migration created: ${filename}`);
      return filename;
      
    } catch (error) {
      logger.error('Error creating migration:', error);
      throw error;
    }
  }

  /**
   * Rollback migration cuối cùng
   */
  async rollbackLastMigration() {
    try {
      const lastMigration = await db.query(`
        SELECT TOP 1 migration_name 
        FROM migrations 
        ORDER BY executed_at DESC
      `);
      
      if (lastMigration[0] && lastMigration[0].length > 0) {
        const migrationName = lastMigration[0][0].migration_name;
        
        // Xóa khỏi bảng migrations
        await db.query('DELETE FROM migrations WHERE migration_name = ?', [migrationName]);
        
        logger.info(`Rolled back migration: ${migrationName}`);
        return migrationName;
      } else {
        logger.info('No migrations to rollback');
        return null;
      }
      
    } catch (error) {
      logger.error('Error rolling back migration:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra trạng thái database
   */
  async checkDatabaseStatus() {
    try {
      const stats = await db.getDatabaseStats();
      
      const status = {
        database: stats.database_name,
        tables: stats.table_count,
        procedures: stats.procedure_count,
        views: stats.view_count,
        migrations: 0
      };

      // Đếm số migrations đã chạy
      try {
        const migrations = await db.query('SELECT COUNT(*) as count FROM migrations');
        status.migrations = migrations[0][0].count;
      } catch (error) {
        // Bảng migrations chưa tồn tại
        status.migrations = 0;
      }

      return status;
      
    } catch (error) {
      logger.error('Error checking database status:', error);
      throw error;
    }
  }

  /**
   * Backup database schema
   */
  async backupSchema() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPath = path.join(__dirname, 'backups', `schema_${timestamp}.sql`);
      
      // Tạo thư mục backup nếu chưa có
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      
      // Lấy schema của tất cả tables
      const tables = await db.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      
      let schemaSQL = `-- Database Schema Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
      
      for (const table of tables[0]) {
        const tableName = table.TABLE_NAME;
        
        // Lấy CREATE TABLE statement
        const createTable = await this.getCreateTableStatement(tableName);
        schemaSQL += `${createTable}\nGO\n\n`;
      }
      
      await fs.writeFile(backupPath, schemaSQL, 'utf8');
      
      logger.info(`Schema backup created: ${backupPath}`);
      return backupPath;
      
    } catch (error) {
      logger.error('Error backing up schema:', error);
      throw error;
    }
  }

  /**
   * Lấy CREATE TABLE statement
   */
  async getCreateTableStatement(tableName) {
    try {
      const columns = await db.query(`
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH,
          IS_NULLABLE,
          COLUMN_DEFAULT,
          COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA+'.'+TABLE_NAME), COLUMN_NAME, 'IsIdentity') as IS_IDENTITY
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION
      `, [tableName]);
      
      let sql = `CREATE TABLE [${tableName}] (\n`;
      
      const columnDefs = columns[0].map(col => {
        let def = `  [${col.COLUMN_NAME}] ${col.DATA_TYPE}`;
        
        if (col.CHARACTER_MAXIMUM_LENGTH) {
          def += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
        }
        
        if (col.IS_IDENTITY) {
          def += ' IDENTITY(1,1)';
        }
        
        if (col.IS_NULLABLE === 'NO') {
          def += ' NOT NULL';
        }
        
        if (col.COLUMN_DEFAULT) {
          def += ` DEFAULT ${col.COLUMN_DEFAULT}`;
        }
        
        return def;
      });
      
      sql += columnDefs.join(',\n');
      sql += '\n);';
      
      return sql;
      
    } catch (error) {
      logger.error(`Error getting CREATE TABLE for ${tableName}:`, error);
      return `-- Error getting CREATE TABLE for ${tableName}`;
    }
  }
}

module.exports = MSSQLSchemaManager;