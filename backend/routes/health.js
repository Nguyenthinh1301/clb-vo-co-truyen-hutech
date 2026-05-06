/**
 * Health Check Routes
 * Endpoints để kiểm tra trạng thái hệ thống
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const cacheService = require('../services/cacheService');
const os = require('os');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed system health information
 */
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  // Check Database với MSSQL specific monitoring
  try {
    const result = await db.testConnection();
    if (result && result.success !== false) {
      healthCheck.services.database = {
        status: 'healthy',
        message: 'Database connection successful',
        type: process.env.DB_TYPE || 'mysql'
      };

      // MSSQL specific health checks
      if (process.env.DB_TYPE === 'mssql') {
        try {
          // Get server info
          const serverInfo = await db.query('SELECT @@VERSION as version, @@SERVERNAME as server_name, DB_NAME() as database_name');
          
          // Get performance metrics
          const performanceService = require('../services/mssqlPerformanceService').getInstance();
          const metrics = performanceService.getMetrics();
          const health = await performanceService.checkHealth();
          
          healthCheck.services.database.mssql = {
            serverInfo: serverInfo[0]?.[0],
            connectionStats: metrics.connectionStats,
            databaseUsage: metrics.databaseUsage,
            health: health,
            slowQueriesCount: metrics.slowQueries?.length || 0,
            lastMetricsUpdate: metrics.lastCheck
          };

          // Database statistics
          const dbStats = await db.getDatabaseStats();
          healthCheck.services.database.statistics = dbStats;
          
        } catch (mssqlError) {
          healthCheck.services.database.mssqlWarning = `MSSQL monitoring error: ${mssqlError.message}`;
        }
      }
      
    } else {
      throw new Error(result?.message || 'Database connection failed');
    }
  } catch (error) {
    healthCheck.services.database = {
      status: 'unhealthy',
      message: error.message,
      type: process.env.DB_TYPE || 'mysql'
    };
    healthCheck.success = false;
  }

  // Check Cache
  try {
    const cacheStats = cacheService.getStats();
    healthCheck.services.cache = {
      status: 'healthy',
      stats: cacheStats
    };
  } catch (error) {
    healthCheck.services.cache = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // System Information
  healthCheck.system = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      used: `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usagePercent: `${(((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2)}%`
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      loadAverage: os.loadavg()
    }
  };

  // Process Information
  healthCheck.process = {
    pid: process.pid,
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`
    },
    uptime: `${(process.uptime() / 60).toFixed(2)} minutes`
  };

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    const dbResult = await db.testConnection();
    if (!dbResult || dbResult.success === false) {
      throw new Error(dbResult?.message || 'Database not ready');
    }
    
    res.status(200).json({
      success: true,
      status: 'ready',
      message: 'Service is ready to accept traffic',
      database: dbResult.message || 'Connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
      message: 'Service is not ready',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    message: 'Service is alive'
  });
});

// SMTP connectivity test — chỉ dùng để debug, xóa sau khi fix
router.get('/smtp-test', async (req, res) => {
    const net = require('net');
    const nodemailer = require('nodemailer');

    function testPort(host, port) {
        return new Promise(resolve => {
            const s = new net.Socket();
            s.setTimeout(5000);
            s.on('connect', () => { s.destroy(); resolve(true); });
            s.on('timeout', () => { s.destroy(); resolve(false); });
            s.on('error', () => { s.destroy(); resolve(false); });
            s.connect(port, host);
        });
    }

    const results = {};
    results['tcp_587'] = await testPort('smtp.gmail.com', 587);
    results['tcp_465'] = await testPort('smtp.gmail.com', 465);

    // Test actual SMTP
    try {
        const t = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 465, secure: true,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: 8000, socketTimeout: 10000
        });
        await t.verify();
        results['smtp_465_verify'] = 'OK';
    } catch(e) {
        results['smtp_465_verify'] = e.message;
    }

    try {
        const t = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 587, secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: 8000, socketTimeout: 10000
        });
        await t.verify();
        results['smtp_587_verify'] = 'OK';
    } catch(e) {
        results['smtp_587_verify'] = e.message;
    }

    res.json({ success: true, smtp_user: process.env.SMTP_USER, results });
});

module.exports = router;
/**
 * @swagger
 * /health/mssql-performance:
 *   get:
 *     summary: MSSQL Performance metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: MSSQL performance information
 */
router.get('/mssql-performance', async (req, res) => {
  try {
    if (process.env.DB_TYPE !== 'mssql') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only available for MSSQL databases'
      });
    }

    const performanceService = require('../services/mssqlPerformanceService').getInstance();
    const report = performanceService.generatePerformanceReport();
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting MSSQL performance metrics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/mssql-optimize:
 *   post:
 *     summary: Optimize MSSQL database
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database optimization completed
 */
router.post('/mssql-optimize', async (req, res) => {
  try {
    if (process.env.DB_TYPE !== 'mssql') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only available for MSSQL databases'
      });
    }

    const performanceService = require('../services/mssqlPerformanceService').getInstance();
    const optimizations = await performanceService.optimizeDatabase();
    
    res.json({
      success: true,
      message: 'Database optimization completed',
      optimizations: optimizations,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error optimizing MSSQL database',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /health/database-stats:
 *   get:
 *     summary: Database statistics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database statistics and information
 */
router.get('/database-stats', async (req, res) => {
  try {
    const stats = {
      type: process.env.DB_TYPE || 'mysql',
      timestamp: new Date().toISOString()
    };

    if (process.env.DB_TYPE === 'mssql') {
      // MSSQL specific stats
      const dbStats = await db.getDatabaseStats();
      const serverInfo = await db.query('SELECT @@VERSION as version, @@SERVERNAME as server_name, DB_NAME() as database_name');
      
      stats.mssql = {
        server: serverInfo[0]?.[0],
        statistics: dbStats,
        tables: await db.query(`
          SELECT 
            TABLE_NAME,
            (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as column_count
          FROM INFORMATION_SCHEMA.TABLES t
          WHERE TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `)
      };
    } else {
      // MySQL stats
      stats.mysql = {
        version: await db.query('SELECT VERSION() as version'),
        tables: await db.query('SHOW TABLES')
      };
    }

    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting database statistics',
      error: error.message
    });
  }
});