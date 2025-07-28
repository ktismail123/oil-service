const express = require('express');
const cors = require('cors');
const app = express();
const { initDB } = require('./config/db');

app.use(cors());
app.use(express.json());

app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/models', require('./routes/modelRoutes'));
app.use('/api/oil-types', require('./routes/oilTypeRoutes'));
app.use('/api/oil-filters', require('./routes/oilFilterRoutes'));
// app.use('/api/battery-types', require('./routes/batteryTypeRoutes'));
app.use('/api/accessories', require('./routes/accessoryRoutes'));
// app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
// app.use('/api/settings', require('./routes/settingRoutes'));

initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

module.exports = app;