const express = require('express');
const router = express.Router();
const { getAllBookings, createBooking, createNewBooking } = require('../controllers/bookingController');

router.get('/', getAllBookings);
router.post('/', createNewBooking);

module.exports = router;