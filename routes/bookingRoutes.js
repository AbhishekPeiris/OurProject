import express from 'express';
const router = express.Router();
import {
    createBooking,
    getBookings,
    getBooking,
    updateBooking,
    deleteBooking,
    confirmBooking,
    cancelBooking,
    getUserBookings,
    checkGroundAvailability,
    exportBookingsCSV
} from '../controllers/bookingController.js';

// Middleware (uncomment when auth middleware is available)
// const { protect, authorize } = require('../middleware/auth');

// All routes require authentication (uncomment when auth middleware is available)
// router.use(protect);

// Admin booking management routes
router.get('/', getBookings); // Get all bookings (Admin)
router.post('/', createBooking); // Create booking
router.get('/export/csv', /* protect, authorize('admin'), */ exportBookingsCSV); // Export routes
router.get('/check-availability', checkGroundAvailability); // Check availability
router.get('/user/:userId', getUserBookings); // Get user bookings
router.get('/:id', getBooking); // Get single booking
router.put('/:id', updateBooking); // Update booking (Admin)
router.delete('/:id', deleteBooking); // Delete booking (Admin)

// Booking management routes
router.put('/:id/confirm', confirmBooking);
router.put('/:id/cancel', cancelBooking);

export default router;
