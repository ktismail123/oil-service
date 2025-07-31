const express = require('express');
const { getAllBatteryTypes } = require('../controllers/batteryController');
const router = express.Router();

router.get('/', getAllBatteryTypes);

module.exports = router;