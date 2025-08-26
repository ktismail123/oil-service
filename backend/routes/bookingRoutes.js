const express = require('express');
const router = express.Router();
const { getAllBookings, createBooking, createNewBooking, updateBooking, deleteBooking, updateBookingStatus } = require('../controllers/bookingController');

router.get('/', getAllBookings);
router.post('/', createNewBooking);
router.put('/:id', updateBooking);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);

module.exports = router;