const express = require('express');
const router = express.Router();
const { getAllAccessorys, createAccessory, updateAccessory, deleteAccessory } = require('../controllers/accessoryController');

router.get('/', getAllAccessorys);
router.post('/create', createAccessory);
router.put('/:id', updateAccessory);
router.delete('/:id', deleteAccessory);

module.exports = router;