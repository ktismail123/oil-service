const express = require('express');
const router = express.Router();
const { getAllBookings, createBooking, createNewBooking, updateBooking } = require('../controllers/bookingController');

router.get('/', getAllBookings);
router.post('/', createNewBooking);
router.put('/:id', updateBooking);

module.exports = router;