const express = require('express');
const router = express.Router();
const { getAllOilFilters, createOilFilter } = require('../controllers/oilFilterController');

router.get('/', getAllOilFilters);
// router.post('/', createOilFilter);

module.exports = router;