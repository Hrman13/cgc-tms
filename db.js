/**
 * CGC University TMS – Database Connection
 * =========================================
 * Uses mysql2 with connection pooling for efficient queries.
 *
 * Configure environment variables or replace values below:
 *   DB_HOST     - MySQL host (default: localhost)
 *   DB_USER     - MySQL username (default: root)
 *   DB_PASS     - MySQL password
 *   DB_NAME     - Database name (default: cgc_transport)
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASS     || '',
  database: process.env.DB_NAME     || 'cgc_transport',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+05:30'
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully.');
    conn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
  }
})();

module.exports = pool;