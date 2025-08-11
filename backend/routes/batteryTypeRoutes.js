const express = require('express');
const { getAllBatteryTypes, getBatteryTypesByCapacity } = require('../controllers/batteryController');
const router = express.Router();

router.get('/', getAllBatteryTypes);
router.get('/:capacity', getBatteryTypesByCapacity);

module.exports = router;