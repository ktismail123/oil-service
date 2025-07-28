const express = require('express');
const router = express.Router();
const { getAllOilTypes, createOilType, getAllOilTypesByIntervell } = require('../controllers/oilTypeController');

router.get('/', getAllOilTypes);
router.get('/:interval', getAllOilTypesByIntervell);
// router.post('/', createOilType);

module.exports = router;