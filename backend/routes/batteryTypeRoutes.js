const express = require('express');
const { getAllBatteryTypes, getBatteryTypesByCapacity, createBatteryType, updateBatteryType, deleteBatteryType } = require('../controllers/batteryController');
const router = express.Router();

router.get('/', getAllBatteryTypes);
router.get('/:capacity', getBatteryTypesByCapacity);
router.post('/create', createBatteryType);
router.post('/create', createBatteryType);
router.put('/:id', updateBatteryType);
router.delete('/:id', deleteBatteryType);

module.exports = router;