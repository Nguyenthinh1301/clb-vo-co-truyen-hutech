/**
 * Microsoft SQL Server Database Configuration
 * Kết nối và quản lý SQL Server database với tối ưu hóa hiệu suất
 */

const sql = require('mssql');
const logger = require('../services/loggerService');

// SQL Server configuration với tối ưu hóa
const config = {
  server: process.env.MSSQL_SERVER || 'localhost\\SQLEXPRESS',
  database: process.env.MSSQL_DATABASE || 'clb_vo_co_truyen_hutech',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000, // Tăng timeout
    requestTimeout: 60000,
    // Tối ưu hóa hiệu suất
    packetSize: 4096,
    useUTC: false,
    abortTransactionOnError: true,
    // Connection retry
    connectRetryCount: 3,
    connectRetryInterval: 10,
    // Isolation level
    isolationLevel: sql.ISOLATION_LEVEL.READ_COMMITTED
  },
  pool: {
    max: 20, // Tăng số connection
    min: 2,  // Giữ minimum connections
    idleTimeoutMillis: 300000, // 5 phút
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  }
};

// Add authentication
if (process.env.MSSQL_USER) {
  config.user = process.env.MSSQL_USER;
  config.password = process.env.MSSQL_PASSWORD;
  config.authentication = {
    type: 'default'
  };
} else if (process.env.MSSQL_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
}

// Connection pool
let pool = null;

/**
 * Get or create connection pool với retry logic
 */
async function getPool() {
  if (!pool || !pool.connected) {
    try {
      // Đóng pool cũ nếu có
      if (pool) {
        await pool.close();
      }
      
      pool = new sql.ConnectionPool(config);
      
      // Event listeners
      pool.on('connect', () => {
        logger.info('SQL Server connected successfully');
      });
      
      pool.on('error', (err) => {
        logger.error('SQL Server pool error:', err);
        pool = null; // Reset pool để tạo lại
      });
      
      await pool.connect();
      logger.info('SQL Server connection pool created successfully');
      
    } catch (error) {
      logger.error('Error creating SQL Server pool:', error);
      pool = null;
      throw error;
    }
  }
  return pool;
}

/**
 * Execute query
 */
async function query(queryText, params = []) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Helper: chọn đúng type để hỗ trợ Unicode tiếng Việt
    const getType = (val) => {
      if (val === null || val === undefined) return sql.NVarChar;
      if (typeof val === 'string') return sql.NVarChar;
      if (typeof val === 'number') return Number.isInteger(val) ? sql.Int : sql.Float;
      if (typeof val === 'boolean') return sql.Bit;
      if (val instanceof Date) return sql.DateTime;
      return sql.NVarChar;
    };

    // Add parameters
    if (Array.isArray(params)) {
      params.forEach((param, index) => {
        request.input(`param${index}`, getType(param), param);
      });
    } else if (typeof params === 'object') {
      Object.keys(params).forEach(key => {
        request.input(key, getType(params[key]), params[key]);
      });
    }
    
    const result = await request.query(queryText);
    return result.recordset;
  } catch (error) {
    logger.error('SQL Server query error:', error);
    throw error;
  }
}

/**
 * Execute stored procedure
 */
async function execute(procedureName, params = {}) {
  try {
    const pool = await getPool();
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    logger.error('SQL Server execute error:', error);
    throw error;
  }
}

/**
 * Test connection
 */
async function testConnection() {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS test');
    return { success: true, message: 'Connected to SQL Server' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Close connection
 */
async function close() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      logger.info('SQL Server connection closed');
    }
  } catch (error) {
    logger.error('Error closing SQL Server connection:', error);
    throw error;
  }
}

/**
 * Get connection statistics
 */
function getStats() {
  if (!pool) {
    return { connected: false };
  }
  
  return {
    connected: pool.connected,
    connecting: pool.connecting,
    healthy: pool.healthy,
    size: pool.size,
    available: pool.available,
    pending: pool.pending,
    borrowed: pool.borrowed
  };
}

module.exports = {
  sql,
  query,
  execute,
  testConnection,
  close,
  getStats,
  getPool
};
