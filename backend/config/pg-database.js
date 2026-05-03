/**
 * PostgreSQL Database Configuration
 * Drop-in replacement cho MSSQL — cùng interface với mssql-adapter.js
 */

const { Pool } = require('pg');
const logger = require('../services/loggerService');

// ── Connection Pool ──────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : (process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false),
  max: parseInt(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error:', { error: err.message });
});

// ── Helper: convert ? placeholders → $1, $2, ... ────────────
function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ── Helper: convert MSSQL-specific syntax → PostgreSQL ───────
function convertToPostgres(sql) {
  let q = sql;

  // OFFSET/FETCH → LIMIT/OFFSET
  q = q.replace(/OFFSET\s+(\d+)\s+ROWS\s+FETCH\s+NEXT\s+(\d+)\s+ROWS\s+ONLY/gi,
    (_, offset, limit) => `LIMIT ${limit} OFFSET ${offset}`);

  // SELECT TOP N → SELECT ... LIMIT N  (simple case, no subquery)
  q = q.replace(/SELECT\s+TOP\s+(\d+)\s+/gi, (_, n) => `SELECT `).replace(
    /^(SELECT\s+(?!.*LIMIT).*?)(\s+FROM\s+)/i,
    (match, sel, from) => {
      const topMatch = sql.match(/SELECT\s+TOP\s+(\d+)\s+/i);
      if (topMatch) return `${sel}${from}`;
      return match;
    }
  );
  // Simpler TOP replacement
  const topMatch = sql.match(/SELECT\s+TOP\s+(\d+)\s+/i);
  if (topMatch) {
    q = q.replace(/SELECT\s+TOP\s+\d+\s+/i, 'SELECT ');
    if (!/LIMIT\s+\d+/i.test(q)) {
      q = q.trimEnd() + ` LIMIT ${topMatch[1]}`;
    }
  }

  // GETDATE() → NOW()
  q = q.replace(/GETDATE\(\)/gi, 'NOW()');

  // CAST(x AS DATE) — keep as is (PostgreSQL supports it)
  // NVARCHAR → VARCHAR (PostgreSQL uses TEXT or VARCHAR)
  q = q.replace(/NVARCHAR\s*\(\s*MAX\s*\)/gi, 'TEXT');
  q = q.replace(/NVARCHAR\s*\((\d+)\)/gi, 'VARCHAR($1)');
  q = q.replace(/\bNVARCHAR\b/gi, 'TEXT');

  // BIT → BOOLEAN
  q = q.replace(/\bBIT\b/gi, 'BOOLEAN');

  // IDENTITY(1,1) → SERIAL (handled in schema, not needed at runtime)

  // Square brackets → no quotes (PostgreSQL uses double quotes but usually not needed)
  q = q.replace(/\[([^\]]+)\]/g, '$1');

  // ISNULL → COALESCE
  q = q.replace(/ISNULL\s*\(/gi, 'COALESCE(');

  // LEN() → LENGTH()
  q = q.replace(/\bLEN\s*\(/gi, 'LENGTH(');

  // CHARINDEX(needle, haystack) → POSITION(needle IN haystack)
  q = q.replace(/CHARINDEX\s*\(\s*([^,]+),\s*([^)]+)\)/gi,
    (_, needle, haystack) => `POSITION(${needle.trim()} IN ${haystack.trim()})`);

  // STRING_AGG is same in PostgreSQL 9.0+
  // CONCAT is same in PostgreSQL

  return q;
}

// ── Core query ───────────────────────────────────────────────
async function rawQuery(sql, params = []) {
  const converted = convertToPostgres(convertPlaceholders(sql));
  if (process.env.NODE_ENV === 'development') {
    logger.debug('PG Query:', { query: converted, params });
  }
  const result = await pool.query(converted, params);
  return result.rows;
}

// ── Adapter (same interface as mssql-adapter.js) ─────────────
const adapter = {

  async query(sql, params = []) {
    try {
      const rows = await rawQuery(sql, params);
      return [rows, null]; // MySQL-compat format
    } catch (err) {
      logger.error('PG query error:', { sql, error: err.message });
      throw err;
    }
  },

  async findOne(sqlOrTable, paramsOrConditions = []) {
    try {
      if (typeof sqlOrTable === 'string' && /SELECT/i.test(sqlOrTable)) {
        const rows = await rawQuery(sqlOrTable, paramsOrConditions);
        return rows.length > 0 ? rows[0] : null;
      }
      // table + conditions object
      const table = sqlOrTable;
      const cond = paramsOrConditions;
      const keys = Object.keys(cond);
      const vals = Object.values(cond);
      const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
      const rows = await pool.query(
        `SELECT * FROM ${table} WHERE ${where} LIMIT 1`, vals
      );
      return rows.rows.length > 0 ? rows.rows[0] : null;
    } catch (err) {
      logger.error('PG findOne error:', { error: err.message });
      throw err;
    }
  },

  async find(sqlOrTable, paramsOrConditions = []) {
    try {
      if (typeof sqlOrTable === 'string' && /SELECT/i.test(sqlOrTable)) {
        return await rawQuery(sqlOrTable, paramsOrConditions);
      }
      return this.findAll(sqlOrTable, paramsOrConditions);
    } catch (err) {
      logger.error('PG find error:', { error: err.message });
      throw err;
    }
  },

  async findAll(table, conditions = {}, options = {}) {
    try {
      let sql = `SELECT * FROM ${table}`;
      const vals = [];
      if (Object.keys(conditions).length > 0) {
        const where = Object.keys(conditions)
          .map((k, i) => { vals.push(conditions[k]); return `${k} = $${i + 1}`; })
          .join(' AND ');
        sql += ` WHERE ${where}`;
      }
      if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
      if (options.limit)   sql += ` LIMIT ${options.limit}`;
      if (options.offset)  sql += ` OFFSET ${options.offset}`;
      const result = await pool.query(sql, vals);
      return result.rows;
    } catch (err) {
      logger.error('PG findAll error:', { error: err.message });
      throw err;
    }
  },

  async insert(tableOrSql, dataOrParams = []) {
    try {
      if (typeof tableOrSql === 'string' && /INSERT/i.test(tableOrSql)) {
        // Raw INSERT SQL — convert and add RETURNING id
        let sql = tableOrSql;
        const params = Array.isArray(dataOrParams) ? dataOrParams : [];
        if (!/RETURNING/i.test(sql)) sql += ' RETURNING id';
        const rows = await rawQuery(sql, params);
        return rows.length > 0 ? rows[0].id : null;
      }
      // table + data object
      const table = tableOrSql;
      const data  = dataOrParams;
      const keys  = Object.keys(data);
      const vals  = Object.values(data);
      const cols  = keys.join(', ');
      const phs   = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (${cols}) VALUES (${phs}) RETURNING id`, vals
      );
      return result.rows.length > 0 ? result.rows[0].id : null;
    } catch (err) {
      logger.error('PG insert error:', { error: err.message });
      throw err;
    }
  },

  async update(table, data, condOrWhere, condVals = []) {
    try {
      const dataKeys = Object.keys(data);
      const dataVals = Object.values(data);
      const set = dataKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');

      let sql, vals;
      if (typeof condOrWhere === 'string') {
        // 'id = ?' style
        let idx = dataKeys.length;
        const where = condOrWhere.replace(/\?/g, () => `$${++idx}`);
        sql  = `UPDATE ${table} SET ${set} WHERE ${where}`;
        vals = [...dataVals, ...condVals];
      } else {
        const condKeys = Object.keys(condOrWhere);
        const where = condKeys
          .map((k, i) => `${k} = $${dataKeys.length + i + 1}`)
          .join(' AND ');
        sql  = `UPDATE ${table} SET ${set} WHERE ${where}`;
        vals = [...dataVals, ...Object.values(condOrWhere)];
      }
      await pool.query(sql, vals);
      return { affectedRows: 1 };
    } catch (err) {
      logger.error('PG update error:', { error: err.message });
      throw err;
    }
  },

  async delete(table, condOrWhere, condVals = []) {
    try {
      let sql, vals;
      if (typeof condOrWhere === 'string') {
        let idx = 0;
        const where = condOrWhere.replace(/\?/g, () => `$${++idx}`);
        sql  = `DELETE FROM ${table} WHERE ${where}`;
        vals = condVals;
      } else {
        const keys = Object.keys(condOrWhere);
        const where = keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');
        vals = Object.values(condOrWhere);
        sql  = `DELETE FROM ${table} WHERE ${where}`;
      }
      await pool.query(sql, vals);
      return { affectedRows: 1 };
    } catch (err) {
      logger.error('PG delete error:', { error: err.message });
      throw err;
    }
  },

  async findMany(table, conditions = {}, options = {}) {
    return this.findAll(table, conditions, options);
  },

  async bulkInsert(table, records) {
    if (!records || records.length === 0) return { affectedRows: 0 };
    const cols = Object.keys(records[0]);
    const vals = [];
    const rows = records.map((rec, ri) => {
      const phs = cols.map((_, ci) => {
        vals.push(rec[cols[ci]]);
        return `$${ri * cols.length + ci + 1}`;
      });
      return `(${phs.join(', ')})`;
    });
    await pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES ${rows.join(', ')}`, vals
    );
    return { affectedRows: records.length };
  },

  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  async testConnection() {
    try {
      await pool.query('SELECT 1');
      return { success: true, message: 'Connected to PostgreSQL' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async close() {
    await pool.end();
  },

  getStats() {
    return {
      totalCount: pool.totalCount,
      idleCount:  pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  },

  // Expose pool for advanced use
  pool,
};

module.exports = adapter;
