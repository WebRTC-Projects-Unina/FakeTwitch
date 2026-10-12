/**
 * @file db.js
 * @description Configurazione del Connection Pool MySQL e mappatura 1:1
 * tra le eccezioni native del protocollo MySQL e gli status code HTTP.
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '172.28.0.20',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'streaming_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;