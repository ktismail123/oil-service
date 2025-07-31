const express = require('express');
const router = express.Router();
const { getAllBrands, createBrand, updateBrand, deleteBrand } = require('../controllers/brandController');

router.get('/', getAllBrands);
router.post('/', createBrand);
router.put('/:id/update', updateBrand);
router.delete('/:id/delete', deleteBrand);

module.exports = router;