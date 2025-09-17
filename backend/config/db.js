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
  // timezone: '+04:00', // UAE timezone (UTC+4) - COMMENTED OUT
  
  // Connection pool settings to handle idle connections
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
  connectionLimit: 10, // Maximum number of connections in pool
  queueLimit: 0, // No limit on queued requests
  acquireTimeout: 60000, // 60 seconds to get connection
  timeout: 60000, // 60 seconds query timeout
  
  // Keep connection alive settings
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
  
  // Reconnection settings
  reconnect: true,
  idleTimeout: 1800000, // 30 minutes idle timeout
  maxIdle: 10, // Maximum idle connections
  maxReuses: 0, // No limit on connection reuse
  
  // Additional MySQL settings
  charset: 'utf8mb4',
  multipleStatements: false,
  
  // Handle connection errors
  handleDisconnects: true
};

let pool;

async function initDB() {
  try {
    // Use connection pool instead of single connection
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    // Set timezone for the pool - COMMENTED OUT
    // await pool.execute("SET time_zone = '+04:00'");
    
    console.log(`✅ Connected to MySQL database: ${dbConfig.database}`);
    console.log(`✅ Database using system timezone (no offset applied)`);
    
    // Handle pool events
    pool.on('connection', (connection) => {
      console.log('📡 New database connection established as id ' + connection.threadId);
    });
    
    pool.on('error', async (err) => {
      console.error('❌ Database pool error:', err.code);
      
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNRESET' || 
          err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('🔄 Attempting to reconnect to database...');
        await handleReconnection();
      }
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function handleReconnection() {
  try {
    if (pool) {
      await pool.end();
    }
    
    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Recreate the pool
    pool = mysql.createPool(dbConfig);
    
    // Test the new connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log('✅ Database reconnected successfully');
  } catch (error) {
    console.error('❌ Database reconnection failed:', error);
    // Try again after some time
    setTimeout(handleReconnection, 10000);
  }
}

function getDB() {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return pool;
}

// Health check function
async function checkDBHealth() {
  try {
    if (!pool) {
      return { healthy: false, error: 'Pool not initialized' };
    }
    
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    return { healthy: true, message: 'Database connection is healthy' };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

// Graceful shutdown
async function closeDB() {
  if (pool) {
    try {
      await pool.end();
      console.log('🔒 Database connection pool closed');
    } catch (error) {
      console.error('❌ Error closing database pool:', error);
    }
  }
}

// Keep connections alive by running a simple query periodically
let keepAliveInterval;

function startKeepAlive() {
  // Ping database every 5 minutes to keep connections alive
  keepAliveInterval = setInterval(async () => {
    try {
      if (pool) {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('Database keep-alive ping sent');
      }
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error);
    }
  }, 300000); // 5 minutes
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  console.log('📨 SIGTERM received, closing database connections...');
  stopKeepAlive();
  await closeDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📨 SIGINT received, closing database connections...');
  stopKeepAlive();
  await closeDB();
  process.exit(0);
});

module.exports = {
  initDB,
  getDB,
  dbConfig,
  checkDBHealth,
  closeDB,
  startKeepAlive,
  stopKeepAlive
};