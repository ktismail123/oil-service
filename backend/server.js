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
const { initDB } = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');

app.use(cors());
app.use(express.json());

// Public auth routes (no token required)
app.use('/api/auth', require('./routes/authRoutes'));

// Auth middleware protects all routes below
app.use(authMiddleware);

app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/models', require('./routes/modelRoutes'));
app.use('/api/oil-types', require('./routes/oilTypeRoutes'));
app.use('/api/oil-filters', require('./routes/oilFilterRoutes'));
app.use('/api/battery-types', require('./routes/batteryTypeRoutes'));
app.use('/api/accessories', require('./routes/accessoryRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
// app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/print', require('./routes/printRoutes'));

initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;
