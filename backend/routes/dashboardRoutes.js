const express = require('express');
const { getDashboardData, exportDashboardData } = require('../controllers/dashboardController');
const router = express.Router();

// Dashboard data endpoint
// GET /api/dashboard
// Query params: user_id, date_range, start_date, end_date
router.get('/', getDashboardData);
router.get('/export', exportDashboardData);

// Dashboard users endpoint
// GET /api/dashboard/users
// router.get('/users', getDashboardUsers);

module.exports = router;