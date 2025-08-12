const express = require('express');
const router = express.Router();
const { getAllOilTypes, createOilType, getAllOilTypesByIntervell, updateOilType, deleteOilType } = require('../controllers/oilTypeController');

router.get('/', getAllOilTypes);
router.get('/:interval', getAllOilTypesByIntervell);
router.post('/create', createOilType);
router.put('/:id', updateOilType);
router.delete('/:id', deleteOilType);

module.exports = router;