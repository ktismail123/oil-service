const express = require('express');
const { checkCustomer, checkCustomerByPlate } = require('../controllers/customerController');
const router = express.Router();

router.get('/', checkCustomerByPlate);

module.exports = router;