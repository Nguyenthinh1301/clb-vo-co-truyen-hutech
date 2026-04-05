const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clb_vo_co_truyen_hutech',
    charset: 'utf8mb4',
    timezone: '+07:00',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database connection class
class Database {
    constructor() {
        this.pool = pool;
    }

    // Execute query with parameters
    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    // Execute multiple queries in transaction
    async transaction(queries) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const results = [];
            for (const { sql, params } of queries) {
                const [rows] = await connection.execute(sql, params || []);
                results.push(rows);
            }
            
            await connection.commit();
            return results;
        } catch (error) {
            await connection.rollback();
            console.error('Transaction error:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get single record
    async findOne(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    // Get multiple records with pagination
    async findMany(sql, params = [], page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const paginatedSql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
        
        const [rows, countResult] = await Promise.all([
            this.query(paginatedSql, params),
            this.query(`SELECT COUNT(*) as total FROM (${sql}) as count_query`, params)
        ]);
        
        const total = countResult[0].total;
        
        return {
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }

    // Insert record and return ID
    async insert(table, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = fields.map(() => '?').join(', ');
        
        const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await this.query(sql, values);
        
        return result.insertId;
    }

    // Update record
    async update(table, data, where, whereParams = []) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
        const result = await this.query(sql, [...values, ...whereParams]);
        
        return result.affectedRows;
    }

    // Delete record
    async delete(table, where, whereParams = []) {
        const sql = `DELETE FROM ${table} WHERE ${where}`;
        const result = await this.query(sql, whereParams);
        
        return result.affectedRows;
    }

    // Check if record exists
    async exists(table, where, whereParams = []) {
        const sql = `SELECT 1 FROM ${table} WHERE ${where} LIMIT 1`;
        const result = await this.query(sql, whereParams);
        
        return result.length > 0;
    }

    // Get table schema
    async getTableSchema(tableName) {
        const sql = 'DESCRIBE ??';
        return await this.query(sql, [tableName]);
    }

    // Test database connection
    async testConnection() {
        try {
            await this.query('SELECT 1');
            return { success: true, message: 'Database connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // Close all connections
    async close() {
        await this.pool.end();
    }

    // Get connection statistics
    async getStats() {
        return {
            totalConnections: this.pool.pool._allConnections.length,
            freeConnections: this.pool.pool._freeConnections.length,
            acquiringConnections: this.pool.pool._acquiringConnections.length
        };
    }
}

// Create and export database instance
const db = new Database();

// Test connection on startup
db.testConnection()
    .then(result => {
        if (result.success) {
            console.log('✅ Database connected successfully');
        } else {
            console.error('❌ Database connection failed:', result.message);
        }
    })
    .catch(error => {
        console.error('❌ Database connection error:', error.message);
    });

module.exports = db;