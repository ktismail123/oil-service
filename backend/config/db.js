const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load correct .env file based on ENVIRONMENT
dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.ENVIRONMENT || 'development'}`
  )
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true'
};

let db;

async function initDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log(`Connected to MySQL database: ${dbConfig.database}`);
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
