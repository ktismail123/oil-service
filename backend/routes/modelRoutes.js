const express = require('express');
const router = express.Router();
const { getModelByBrand, getAllModels } = require('../controllers/modelController');

router.get('/:brandId', getModelByBrand);
router.get('/', getAllModels);
// router.post('/', createModel);

module.exports = router;