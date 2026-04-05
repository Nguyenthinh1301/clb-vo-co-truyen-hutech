const fs = require('fs').promises;
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = process.env.LOG_DIR || 'logs';
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 5;
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        this.colors = {
            error: '\x1b[31m', // Red
            warn: '\x1b[33m',  // Yellow
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[35m', // Magenta
            reset: '\x1b[0m'
        };

        this.initializeLogDir();
    }

    // Initialize log directory
    async initializeLogDir() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    // Check if should log based on level
    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    // Format log message
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        
        return {
            timestamp,
            level: level.toUpperCase(),
            message,
            meta: metaStr,
            formatted: `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`
        };
    }

    // Write to log file
    async writeToFile(filename, content) {
        try {
            const filePath = path.join(this.logDir, filename);
            
            // Check file size and rotate if needed
            try {
                const stats = await fs.stat(filePath);
                if (stats.size > this.maxFileSize) {
                    await this.rotateLogFile(filename);
                }
            } catch (error) {
                // File doesn't exist yet, that's okay
            }

            await fs.appendFile(filePath, content + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    // Rotate log file
    async rotateLogFile(filename) {
        try {
            const baseName = filename.replace('.log', '');
            
            // Delete oldest file if max files reached
            const oldestFile = `${baseName}.${this.maxFiles}.log`;
            try {
                await fs.unlink(path.join(this.logDir, oldestFile));
            } catch (error) {
                // File doesn't exist, that's okay
            }

            // Rotate existing files
            for (let i = this.maxFiles - 1; i >= 1; i--) {
                const oldFile = `${baseName}.${i}.log`;
                const newFile = `${baseName}.${i + 1}.log`;
                
                try {
                    await fs.rename(
                        path.join(this.logDir, oldFile),
                        path.join(this.logDir, newFile)
                    );
                } catch (error) {
                    // File doesn't exist, continue
                }
            }

            // Rename current file
            await fs.rename(
                path.join(this.logDir, filename),
                path.join(this.logDir, `${baseName}.1.log`)
            );
        } catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }

    // Log error
    error(message, meta = {}) {
        if (!this.shouldLog('error')) return;

        const log = this.formatMessage('error', message, meta);
        
        // Console output with color
        console.error(`${this.colors.error}${log.formatted}${this.colors.reset}`);
        
        // Write to file
        this.writeToFile('error.log', log.formatted);
        this.writeToFile('combined.log', log.formatted);
    }

    // Log warning
    warn(message, meta = {}) {
        if (!this.shouldLog('warn')) return;

        const log = this.formatMessage('warn', message, meta);
        
        // Console output with color
        console.warn(`${this.colors.warn}${log.formatted}${this.colors.reset}`);
        
        // Write to file
        this.writeToFile('combined.log', log.formatted);
    }

    // Log info
    info(message, meta = {}) {
        if (!this.shouldLog('info')) return;

        const log = this.formatMessage('info', message, meta);
        
        // Console output with color
        console.log(`${this.colors.info}${log.formatted}${this.colors.reset}`);
        
        // Write to file
        this.writeToFile('combined.log', log.formatted);
    }

    // Log debug
    debug(message, meta = {}) {
        if (!this.shouldLog('debug')) return;

        const log = this.formatMessage('debug', message, meta);
        
        // Console output with color
        console.log(`${this.colors.debug}${log.formatted}${this.colors.reset}`);
        
        // Write to file
        this.writeToFile('debug.log', log.formatted);
        this.writeToFile('combined.log', log.formatted);
    }

    // Log HTTP request
    http(req, res, duration) {
        const log = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        this.info('HTTP Request', log);
        this.writeToFile('access.log', JSON.stringify(log));
    }

    // Log database query
    query(sql, params, duration) {
        const log = {
            sql: sql.substring(0, 200), // Truncate long queries
            params: params ? JSON.stringify(params).substring(0, 100) : null,
            duration: `${duration}ms`
        };

        this.debug('Database Query', log);
    }

    // Log authentication event
    auth(event, userId, success, meta = {}) {
        const log = {
            event,
            userId,
            success,
            ...meta
        };

        this.info(`Auth: ${event}`, log);
        this.writeToFile('auth.log', JSON.stringify(log));
    }

    // Log payment event
    payment(event, paymentId, amount, status, meta = {}) {
        const log = {
            event,
            paymentId,
            amount,
            status,
            ...meta
        };

        this.info(`Payment: ${event}`, log);
        this.writeToFile('payment.log', JSON.stringify(log));
    }

    // Get log files
    async getLogFiles() {
        try {
            const files = await fs.readdir(this.logDir);
            const logFiles = [];

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                
                logFiles.push({
                    name: file,
                    size: stats.size,
                    sizeFormatted: this.formatFileSize(stats.size),
                    modified: stats.mtime,
                    created: stats.birthtime
                });
            }

            return logFiles.sort((a, b) => b.modified - a.modified);
        } catch (error) {
            console.error('Failed to get log files:', error);
            return [];
        }
    }

    // Read log file
    async readLogFile(filename, options = {}) {
        try {
            const { lines = 100, reverse = true } = options;
            const filePath = path.join(this.logDir, filename);
            
            const content = await fs.readFile(filePath, 'utf-8');
            let logLines = content.split('\n').filter(line => line.trim());

            if (reverse) {
                logLines = logLines.reverse();
            }

            if (lines) {
                logLines = logLines.slice(0, lines);
            }

            return {
                filename,
                lines: logLines,
                totalLines: logLines.length
            };
        } catch (error) {
            console.error('Failed to read log file:', error);
            return { filename, lines: [], totalLines: 0 };
        }
    }

    // Search logs
    async searchLogs(query, options = {}) {
        try {
            const { filename = 'combined.log', caseSensitive = false } = options;
            const filePath = path.join(this.logDir, filename);
            
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            
            const searchRegex = new RegExp(
                query,
                caseSensitive ? 'g' : 'gi'
            );

            const matches = lines.filter(line => searchRegex.test(line));

            return {
                query,
                filename,
                matches,
                totalMatches: matches.length
            };
        } catch (error) {
            console.error('Failed to search logs:', error);
            return { query, filename, matches: [], totalMatches: 0 };
        }
    }

    // Clear old logs
    async clearOldLogs(daysOld = 30) {
        try {
            const files = await fs.readdir(this.logDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(this.logDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }

            this.info(`Cleared ${deletedCount} old log files`);
            return deletedCount;
        } catch (error) {
            console.error('Failed to clear old logs:', error);
            return 0;
        }
    }

    // Get log statistics
    async getLogStats() {
        try {
            const files = await this.getLogFiles();
            
            let totalSize = 0;
            files.forEach(file => {
                totalSize += file.size;
            });

            return {
                totalFiles: files.length,
                totalSize,
                totalSizeFormatted: this.formatFileSize(totalSize),
                files: files.map(f => ({
                    name: f.name,
                    size: f.sizeFormatted,
                    modified: f.modified
                }))
            };
        } catch (error) {
            console.error('Failed to get log stats:', error);
            return { totalFiles: 0, totalSize: 0, files: [] };
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Create logger middleware for Express
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            // Log when response finishes
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                this.http(req, res, duration);
            });

            next();
        };
    }
}

// Create and export logger service instance
const logger = new LoggerService();

module.exports = logger;