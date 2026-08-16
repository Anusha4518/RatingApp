// db.js — Creates a MySQL connection pool
// A "pool" means we keep a set of connections open and reuse them
// instead of opening a new connection for every request. This is faster.

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'store_rating_db',

  // How many connections can be open at the same time
  connectionLimit: 10,

  // Allow waiting for a connection if all are busy
  waitForConnections: true,

  // 0 = no limit on how many requests can queue up
  queueLimit: 0,
});

export default pool;
