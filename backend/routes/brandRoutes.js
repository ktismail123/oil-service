const express = require('express');
const router = express.Router();
const { getAllBrands, createBrand, updateBrand } = require('../controllers/brandController');

router.get('/', getAllBrands);
router.post('/', createBrand);
router.put('/:id/update', updateBrand);

module.exports = router;