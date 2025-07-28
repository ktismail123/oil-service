const express = require('express');
const router = express.Router();
const { getAllAccessorys, createAccessory } = require('../controllers/accessoryController');

router.get('/', getAllAccessorys);
// router.post('/', createAccessory);

module.exports = router;