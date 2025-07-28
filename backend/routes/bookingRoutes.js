const express = require('express');
const router = express.Router();
const { getAllBookings, createBooking } = require('../controllers/bookingController');

router.get('/', getAllBookings);

module.exports = router;