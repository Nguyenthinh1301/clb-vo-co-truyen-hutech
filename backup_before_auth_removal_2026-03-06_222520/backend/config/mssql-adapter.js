/**
 * MSSQL Adapter với tối ưu hóa hiệu suất
 * Makes MSSQL work like MySQL for existing code
 */

const mssqlDb = require('./mssql-database');
const logger = require('../services/loggerService');

// Cache cho prepared statements
const preparedStatements = new Map();

// Adapter to make MSSQL work like MySQL
const adapter = {
  // Query method compatible với MySQL và tối ưu hóa
  async query(sql, params = []) {
    try {
      // Convert MySQL ? placeholders to MSSQL @param0, @param1
      let mssqlQuery = sql;
      let paramIndex = 0;
      
      // Thay thế ? bằng @param
      mssqlQuery = mssqlQuery.replace(/\?/g, () => {
        return `@param${paramIndex++}`;
      });
      
      // Xử lý MySQL syntax thành MSSQL
      mssqlQuery = this.convertMySQLToMSSQL(mssqlQuery);
      
      // Log query để debug (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('MSSQL Query:', { query: mssqlQuery, params });
      }
      
      // Execute query
      const result = await mssqlDb.query(mssqlQuery, params);
      
      // Return in MySQL format [rows, fields]
      return [result || [], null];
      
    } catch (error) {
      logger.error('MSSQL Adapter query error:', { sql, params, error: error.message });
      throw error;
    }
  },

  // Convert MySQL syntax to MSSQL
  convertMySQLToMSSQL(query) {
    let mssqlQuery = query;
    
    // 1. Convert LIMIT to TOP
    const limitMatch = mssqlQuery.match(/LIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?$/i);
    if (limitMatch) {
      const limit = limitMatch[1];
      const offset = limitMatch[2] || 0;
      
      if (offset > 0) {
        // Sử dụng OFFSET/FETCH cho SQL Server 2012+
        mssqlQuery = mssqlQuery.replace(/LIMIT\s+\d+(?:\s+OFFSET\s+\d+)?$/i, '');
        mssqlQuery += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      } else {
        // Sử dụng TOP cho simple LIMIT
        mssqlQuery = mssqlQuery.replace(/LIMIT\s+\d+$/i, '');
        mssqlQuery = mssqlQuery.replace(/^SELECT/i, `SELECT TOP ${limit}`);
      }
    }
    
    // 2. Convert MySQL functions
    mssqlQuery = mssqlQuery.replace(/NOW\(\)/gi, 'GETDATE()');
    mssqlQuery = mssqlQuery.replace(/UNIX_TIMESTAMP\(\)/gi, 'DATEDIFF(SECOND, \'1970-01-01\', GETDATE())');
    mssqlQuery = mssqlQuery.replace(/DATE\(/gi, 'CAST(');
    
    // 3. Convert AUTO_INCREMENT to IDENTITY
    mssqlQuery = mssqlQuery.replace(/AUTO_INCREMENT/gi, 'IDENTITY(1,1)');
    
    // 4. Convert backticks to square brackets
    mssqlQuery = mssqlQuery.replace(/`([^`]+)`/g, '[$1]');
    
    // 5. Convert CONCAT function
    mssqlQuery = mssqlQuery.replace(/CONCAT\(([^)]+)\)/gi, (match, args) => {
      return args.split(',').map(arg => arg.trim()).join(' + ');
    });
    
    return mssqlQuery;
  },

  // Find one record - supports both table+conditions and raw SQL
  async findOne(tableOrSql, conditionsOrParams = []) {
    try {
      // Check if first param is a SQL query (contains SELECT)
      if (typeof tableOrSql === 'string' && tableOrSql.toUpperCase().includes('SELECT')) {
        // Raw SQL query
        let sql = tableOrSql;
        let params = Array.isArray(conditionsOrParams) ? conditionsOrParams : [];
        
        // Convert MySQL ? to MSSQL @param
        let paramIndex = 0;
        sql = sql.replace(/\?/g, () => `@param${paramIndex++}`);
        
        const result = await mssqlDb.query(sql, params);
        return result && result.length > 0 ? result[0] : null;
      } else {
        // Table name + conditions object
        const table = tableOrSql;
        const conditions = conditionsOrParams;
        const keys = Object.keys(conditions);
        const whereClause = keys.map((key, index) => `${key} = @param${index}`).join(' AND ');
        const values = Object.values(conditions);
        
        const sql = `SELECT TOP 1 * FROM ${table} WHERE ${whereClause}`;
        const result = await mssqlDb.query(sql, values);
        
        return result && result.length > 0 ? result[0] : null;
      }
    } catch (error) {
      throw error;
    }
  },

  // Find all records
  async findAll(table, conditions = {}, options = {}) {
    try {
      let sql = `SELECT * FROM ${table}`;
      const values = [];
      
      if (Object.keys(conditions).length > 0) {
        const keys = Object.keys(conditions);
        const whereClause = keys.map((key, index) => {
          values.push(conditions[key]);
          return `${key} = @param${index}`;
        }).join(' AND ');
        sql += ` WHERE ${whereClause}`;
      }
      
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      }
      
      if (options.limit) {
        sql = sql.replace('SELECT', `SELECT TOP ${options.limit}`);
      }
      
      const result = await mssqlDb.query(sql, values);
      return result || [];
    } catch (error) {
      throw error;
    }
  },

  // Insert record - supports both table+data and raw SQL
  async insert(tableOrSql, dataOrParams = []) {
    try {
      // Check if first param is a SQL query
      if (typeof tableOrSql === 'string' && tableOrSql.toUpperCase().includes('INSERT')) {
        // Raw SQL query
        let sql = tableOrSql;
        let params = Array.isArray(dataOrParams) ? dataOrParams : [];
        
        // Convert MySQL ? to MSSQL @param
        let paramIndex = 0;
        sql = sql.replace(/\?/g, () => `@param${paramIndex++}`);
        
        const result = await mssqlDb.query(sql, params);
        return {
          insertId: result && result.length > 0 ? result[0].id : null,
          affectedRows: 1
        };
      } else {
        // Table name + data object
        const table = tableOrSql;
        const data = dataOrParams;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const columns = keys.join(', ');
        const placeholders = keys.map((_, index) => `@param${index}`).join(', ');
        
        const sql = `INSERT INTO ${table} (${columns}) OUTPUT INSERTED.id VALUES (${placeholders})`;
        const result = await mssqlDb.query(sql, values);
        
        // Return insertId directly (not as object property)
        const insertId = result && result.length > 0 ? result[0].id : null;
        
        // For compatibility, return the insertId directly when used with await
        return insertId;
      }
    } catch (error) {
      throw error;
    }
  },

  // Update record - supports both object conditions and SQL WHERE clause
  async update(table, data, conditionsOrWhere, conditionValues = []) {
    try {
      const dataKeys = Object.keys(data);
      const setClause = dataKeys.map((key, index) => `${key} = @param${index}`).join(', ');
      const dataValues = Object.values(data);
      
      let sql;
      let values;
      
      // Check if conditions is a string (SQL WHERE clause)
      if (typeof conditionsOrWhere === 'string') {
        // SQL WHERE clause format: update('users', {data}, 'id = ?', [userId])
        let whereClause = conditionsOrWhere;
        let paramIndex = dataKeys.length;
        
        // Convert ? to @param
        whereClause = whereClause.replace(/\?/g, () => `@param${paramIndex++}`);
        
        sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        values = [...dataValues, ...conditionValues];
      } else {
        // Object conditions format: update('users', {data}, {id: userId})
        const conditionKeys = Object.keys(conditionsOrWhere);
        const whereClause = conditionKeys.map((key, index) => 
          `${key} = @param${dataKeys.length + index}`
        ).join(' AND ');
        
        sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        values = [...dataValues, ...Object.values(conditionsOrWhere)];
      }
      
      await mssqlDb.query(sql, values);
      return { affectedRows: 1 };
    } catch (error) {
      throw error;
    }
  },

  // Delete record
  async delete(table, conditions) {
    try {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = @param${index}`).join(' AND ');
      const values = Object.values(conditions);
      
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      await mssqlDb.query(sql, values);
      
      return { affectedRows: 1 };
    } catch (error) {
      throw error;
    }
  },

  // Test connection
  async testConnection() {
    return await mssqlDb.testConnection();
  },

  // Close connection
  async close() {
    return await mssqlDb.close();
  },

  // Get stats
  getStats() {
    return mssqlDb.getStats();
  },

  // Execute raw SQL (for compatibility)
  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  // Find all with raw SQL support
  async find(sqlOrTable, paramsOrConditions = []) {
    if (typeof sqlOrTable === 'string' && sqlOrTable.toUpperCase().includes('SELECT')) {
      // Raw SQL
      let sql = sqlOrTable;
      let params = Array.isArray(paramsOrConditions) ? paramsOrConditions : [];
      
      let paramIndex = 0;
      sql = sql.replace(/\?/g, () => `@param${paramIndex++}`);
      
      const result = await mssqlDb.query(sql, params);
      return result || [];
    } else {
      // Use findAll
      return this.findAll(sqlOrTable, paramsOrConditions);
    }
  },

  // Bulk insert tối ưu cho MSSQL
  async bulkInsert(table, records) {
    try {
      if (!records || records.length === 0) {
        return { affectedRows: 0 };
      }

      const columns = Object.keys(records[0]);
      const placeholders = records.map((_, recordIndex) => 
        `(${columns.map((_, colIndex) => `@param${recordIndex * columns.length + colIndex}`).join(', ')})`
      ).join(', ');

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;
      
      // Flatten parameters
      const params = [];
      records.forEach(record => {
        columns.forEach(col => {
          params.push(record[col]);
        });
      });

      const result = await mssqlDb.query(sql, params);
      return { affectedRows: records.length };
      
    } catch (error) {
      logger.error('Bulk insert error:', error);
      throw error;
    }
  },

  // Find many records with pagination and filtering
  async findMany(table, conditions = {}, options = {}) {
    try {
      let sql = `SELECT * FROM ${table}`;
      const values = [];
      
      // Add WHERE clause if conditions provided
      if (Object.keys(conditions).length > 0) {
        const keys = Object.keys(conditions);
        const whereClause = keys.map((key, index) => {
          values.push(conditions[key]);
          return `${key} = @param${index}`;
        }).join(' AND ');
        sql += ` WHERE ${whereClause}`;
      }
      
      // Add ORDER BY if specified
      if (options.orderBy) {
        sql += ` ORDER BY ${options.orderBy}`;
      } else {
        sql += ` ORDER BY id DESC`; // Default ordering
      }
      
      // Add pagination
      if (options.limit || options.offset) {
        const offset = options.offset || 0;
        const limit = options.limit || 50;
        
        sql += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
      }
      
      const result = await mssqlDb.query(sql, values);
      return result || [];
    } catch (error) {
      logger.error('FindMany error:', { table, conditions, options, error: error.message });
      throw error;
    }
  },

  // Get database statistics
  async getDatabaseStats() {
    try {
      const sql = `
        SELECT 
          DB_NAME() as database_name,
          (SELECT COUNT(*) FROM sys.tables WHERE type = 'U') as table_count,
          (SELECT COUNT(*) FROM sys.procedures WHERE type = 'P') as procedure_count,
          (SELECT COUNT(*) FROM sys.views WHERE type = 'V') as view_count
      `;
      
      const result = await mssqlDb.query(sql);
      return result && result[0] ? result[0] : {};
      
    } catch (error) {
      logger.error('Database stats error:', error);
      return {};
    }
  }
};

module.exports = adapter;