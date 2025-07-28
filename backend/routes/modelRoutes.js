const express = require('express');
const router = express.Router();
const { getModelByBrand } = require('../controllers/modelController');

router.get('/:brandId', getModelByBrand);
// router.post('/', createModel);

module.exports = router;