const express = require('express');
const router = express.Router();
const { getAllOilFilters, createOilFilter, updateOilFilter, deleteOilFilter } = require('../controllers/oilFilterController');

router.get('/', getAllOilFilters);
router.post('/create', createOilFilter);
router.put('/:id', updateOilFilter);
router.delete('/:id', deleteOilFilter);

module.exports = router;