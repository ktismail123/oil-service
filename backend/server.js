const path = require('path');
const dotenv = require('dotenv');

// Load .env based on ENVIRONMENT
dotenv.config({
  path: path.resolve(
    process.cwd(),
    `.env.${process.env.ENVIRONMENT || 'development'}`
  )
});

const SECRET_KEY = process.env.SECRET_KEY;

// Exit if SECRET_KEY is missing
if (!SECRET_KEY) {
  console.error('FATAL ERROR: SECRET_KEY is not defined.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const app = express();
const { initDB, startKeepAlive, checkDBHealth, closeDB, stopKeepAlive } = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

app.use(cors());
app.use(express.json());

// Database health check endpoint (before auth middleware)
app.get('/health/database', async (req, res) => {
  try {
    const health = await checkDBHealth();
    if (health.healthy) {
      res.status(200).json({ 
        status: 'healthy', 
        message: health.message,
        timestamp: new Date().toISOString(),
        timezone: 'UAE (+04:00)'
      });
    } else {
      res.status(500).json({ 
        status: 'unhealthy', 
        error: health.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Public auth routes (no token required)
app.use('/auth', require('./routes/authRoutes'));

// Auth middleware protects all routes below
app.use(authMiddleware);

app.use('/brands', require('./routes/brandRoutes'));
app.use('/models', require('./routes/modelRoutes'));
app.use('/oil-types', require('./routes/oilTypeRoutes'));
app.use('/oil-filters', require('./routes/oilFilterRoutes'));
app.use('/battery-types', require('./routes/batteryTypeRoutes'));
app.use('/accessories', require('./routes/accessoryRoutes'));
app.use('/user', require('./routes/userRoutes'));
// app.use('/customer', require('./routes/customerRoutes'));
app.use('/bookings', require('./routes/bookingRoutes'));
// app.use('/settings', require('./routes/settingRoutes'));
app.use('/customer', require('./routes/customerRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/print', require('./routes/printRoutes'));

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection pool
    await initDB();
    
    // Start keep-alive mechanism
    startKeepAlive();
    
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🏥 Database health check: http://localhost:${PORT}/health/database`);
      console.log(`🕐 Server timezone: UAE (+04:00)`);
      console.log(`💓 Database keep-alive: Active (ping every 5 minutes)`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n📨 ${signal} received, shutting down gracefully...`);
      
      // Stop accepting new requests
      server.close(async () => {
        console.log('🔒 HTTP server closed');
        
        // Stop keep-alive mechanism
        stopKeepAlive();
        
        // Close database connections
        await closeDB();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;