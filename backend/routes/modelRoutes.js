const express = require('express');
const router = express.Router();
const { getModelByBrand, getAllModels, createModel, updateModel, deleteModel } = require('../controllers/modelController');

router.get('/:brandId', getModelByBrand);
router.get('/', getAllModels);
router.post('/create', createModel);
router.put('/:id', updateModel);
router.delete('/:id', deleteModel);

module.exports = router;