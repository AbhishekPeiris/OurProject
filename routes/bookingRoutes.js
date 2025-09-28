import express from 'express';
const router = express.Router();
import {
    createBooking,
    confirmBooking,
    getUserBookings,
    checkGroundAvailability,
    cancelBooking
} from '../controllers/bookingController.js';

// Booking routes
router.get('/check-availability', checkGroundAvailability);
router.post('/', createBooking);
router.put('/:id/confirm', confirmBooking);
router.put('/:id/cancel', cancelBooking);
router.get('/user/:userId', getUserBookings);

export default router;
