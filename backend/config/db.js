const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '_kt_root_',
  database: 'car_garage_db'
};

let db;

async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

function getDB() {
  return db;
}

module.exports = {
  initDB,
  getDB,
  dbConfig
};