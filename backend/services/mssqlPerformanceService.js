/**
 * MSSQL Performance Monitoring Service
 * Giám sát hiệu suất SQL Server
 */

const db = require('../config/db');
const logger = require('./loggerService');

class MSSQLPerformanceService {
  constructor() {
    this.metrics = {
      queryCount: 0,
      slowQueries: [],
      connectionStats: {},
      lastCheck: new Date()
    };
    
    // Khởi động monitoring
    this.startMonitoring();
  }

  /**
   * Bắt đầu giám sát hiệu suất
   */
  startMonitoring() {
    // Kiểm tra hiệu suất mỗi 5 phút
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);
    
    logger.info('MSSQL Performance monitoring started');
  }

  /**
   * Thu thập metrics hiệu suất
   */
  async collectMetrics() {
    try {
      // 1. Connection pool stats
      await this.getConnectionStats();
      
      // 2. Query performance
      await this.getQueryPerformance();
      
      // 3. Database size và usage
      await this.getDatabaseUsage();
      
      // 4. Index usage
      await this.getIndexUsage();
      
      // 5. Wait statistics
      await this.getWaitStatistics();
      
      this.metrics.lastCheck = new Date();
      
    } catch (error) {
      logger.error('Error collecting MSSQL metrics:', error);
    }
  }

  /**
   * Lấy thống kê connection pool
   */
  async getConnectionStats() {
    try {
      const sql = `
        SELECT 
          DB_NAME() as database_name,
          (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as active_connections,
          (SELECT COUNT(*) FROM sys.dm_exec_requests) as active_requests,
          @@CONNECTIONS as total_connections_since_startup
      `;
      
      const result = await db.query(sql);
      if (result && result[0]) {
        this.metrics.connectionStats = result[0];
      }
      
    } catch (error) {
      logger.error('Error getting connection stats:', error);
    }
  }

  /**
   * Lấy thống kê hiệu suất query
   */
  async getQueryPerformance() {
    try {
      const sql = `
        SELECT TOP 10
          qs.execution_count,
          qs.total_elapsed_time / qs.execution_count as avg_elapsed_time,
          qs.total_cpu_time / qs.execution_count as avg_cpu_time,
          qs.total_logical_reads / qs.execution_count as avg_logical_reads,
          SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
            ((CASE qs.statement_end_offset
              WHEN -1 THEN DATALENGTH(qt.text)
              ELSE qs.statement_end_offset
            END - qs.statement_start_offset)/2)+1) as query_text
        FROM sys.dm_exec_query_stats qs
        CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
        WHERE qs.execution_count > 1
        ORDER BY qs.total_elapsed_time / qs.execution_count DESC
      `;
      
      const result = await db.query(sql);
      if (result && result[0]) {
        this.metrics.slowQueries = result[0].slice(0, 5); // Top 5 slow queries
      }
      
    } catch (error) {
      logger.error('Error getting query performance:', error);
    }
  }

  /**
   * Lấy thông tin sử dụng database
   */
  async getDatabaseUsage() {
    try {
      const sql = `
        SELECT 
          DB_NAME() as database_name,
          SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / 1024 / 1024 as used_space_mb,
          SUM(size * 8192.) / 1024 / 1024 as allocated_space_mb,
          (SUM(size * 8192.) / 1024 / 1024) - (SUM(CAST(FILEPROPERTY(name, 'SpaceUsed') AS bigint) * 8192.) / 1024 / 1024) as free_space_mb
        FROM sys.database_files
        WHERE type_desc = 'ROWS'
      `;
      
      const result = await db.query(sql);
      if (result && result[0]) {
        this.metrics.databaseUsage = result[0];
      }
      
    } catch (error) {
      logger.error('Error getting database usage:', error);
    }
  }

  /**
   * Lấy thống kê sử dụng index
   */
  async getIndexUsage() {
    try {
      const sql = `
        SELECT TOP 10
          OBJECT_NAME(ius.object_id) as table_name,
          i.name as index_name,
          ius.user_seeks,
          ius.user_scans,
          ius.user_lookups,
          ius.user_updates,
          ius.user_seeks + ius.user_scans + ius.user_lookups as total_reads
        FROM sys.dm_db_index_usage_stats ius
        INNER JOIN sys.indexes i ON ius.object_id = i.object_id AND ius.index_id = i.index_id
        WHERE ius.database_id = DB_ID()
          AND OBJECT_NAME(ius.object_id) IS NOT NULL
        ORDER BY ius.user_seeks + ius.user_scans + ius.user_lookups DESC
      `;
      
      const result = await db.query(sql);
      if (result && result[0]) {
        this.metrics.indexUsage = result[0];
      }
      
    } catch (error) {
      logger.error('Error getting index usage:', error);
    }
  }

  /**
   * Lấy wait statistics
   */
  async getWaitStatistics() {
    try {
      const sql = `
        SELECT TOP 10
          wait_type,
          waiting_tasks_count,
          wait_time_ms,
          max_wait_time_ms,
          signal_wait_time_ms,
          wait_time_ms - signal_wait_time_ms as resource_wait_time_ms
        FROM sys.dm_os_wait_stats
        WHERE wait_type NOT IN (
          'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
          'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
          'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
          'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT', 'CLR_AUTO_EVENT',
          'DISPATCHER_QUEUE_SEMAPHORE', 'FT_IFTS_SCHEDULER_IDLE_WAIT',
          'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN'
        )
        AND waiting_tasks_count > 0
        ORDER BY wait_time_ms DESC
      `;
      
      const result = await db.query(sql);
      if (result && result[0]) {
        this.metrics.waitStats = result[0];
      }
      
    } catch (error) {
      logger.error('Error getting wait statistics:', error);
    }
  }

  /**
   * Lấy tất cả metrics hiện tại
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date(),
      uptime: process.uptime()
    };
  }

  /**
   * Kiểm tra health của database
   */
  async checkHealth() {
    try {
      const health = {
        status: 'healthy',
        issues: [],
        recommendations: []
      };

      // Kiểm tra connection count
      if (this.metrics.connectionStats?.active_connections > 50) {
        health.issues.push('High connection count');
        health.recommendations.push('Consider connection pooling optimization');
      }

      // Kiểm tra slow queries
      if (this.metrics.slowQueries?.length > 0) {
        const slowestQuery = this.metrics.slowQueries[0];
        if (slowestQuery.avg_elapsed_time > 5000) { // > 5 seconds
          health.issues.push('Very slow queries detected');
          health.recommendations.push('Review and optimize slow queries');
        }
      }

      // Kiểm tra database size
      if (this.metrics.databaseUsage?.used_space_mb > 1000) { // > 1GB
        health.recommendations.push('Consider database maintenance and cleanup');
      }

      // Kiểm tra wait stats
      if (this.metrics.waitStats?.length > 0) {
        const topWait = this.metrics.waitStats[0];
        if (topWait.wait_time_ms > 10000) { // > 10 seconds total wait
          health.issues.push(`High wait time for ${topWait.wait_type}`);
          health.recommendations.push('Investigate resource bottlenecks');
        }
      }

      if (health.issues.length > 0) {
        health.status = 'warning';
      }

      return health;
      
    } catch (error) {
      logger.error('Error checking database health:', error);
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Tối ưu hóa database
   */
  async optimizeDatabase() {
    try {
      const optimizations = [];

      // 1. Update statistics
      await db.query('EXEC sp_updatestats');
      optimizations.push('Updated database statistics');

      // 2. Recompile stored procedures
      await db.query(`
        DECLARE @sql NVARCHAR(MAX) = '';
        SELECT @sql = @sql + 'EXEC sp_recompile ''' + SCHEMA_NAME(schema_id) + '.' + name + ''';' + CHAR(13)
        FROM sys.procedures;
        EXEC sp_executesql @sql;
      `);
      optimizations.push('Recompiled stored procedures');

      // 3. Clear plan cache (cẩn thận với production)
      if (process.env.NODE_ENV !== 'production') {
        await db.query('DBCC FREEPROCCACHE');
        optimizations.push('Cleared plan cache');
      }

      logger.info('Database optimization completed', { optimizations });
      return optimizations;

    } catch (error) {
      logger.error('Error optimizing database:', error);
      throw error;
    }
  }

  /**
   * Tạo báo cáo hiệu suất
   */
  generatePerformanceReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        database: metrics.connectionStats?.database_name,
        lastCheck: metrics.lastCheck,
        activeConnections: metrics.connectionStats?.active_connections,
        totalQueries: metrics.queryCount
      },
      performance: {
        slowQueries: metrics.slowQueries?.slice(0, 3),
        topWaits: metrics.waitStats?.slice(0, 3),
        indexUsage: metrics.indexUsage?.slice(0, 5)
      },
      resources: {
        databaseSize: metrics.databaseUsage,
        connectionPool: metrics.connectionStats
      },
      health: this.checkHealth()
    };
  }
}

// Singleton instance
let performanceService = null;

module.exports = {
  getInstance() {
    if (!performanceService) {
      performanceService = new MSSQLPerformanceService();
    }
    return performanceService;
  },
  
  MSSQLPerformanceService
};