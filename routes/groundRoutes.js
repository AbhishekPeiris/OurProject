import express from 'express';
const router = express.Router();
import {
  getAllGrounds,
  getGround,
  createGround,
  updateGround,
  deleteGround,
  getAvailableGroundSlots,
  exportGroundsCSV
} from '../controllers/groundController.js';

// Middleware (Note: You'll need to implement these middleware functions)
// const { protect, authorize } = require('../middleware/auth');

// All routes require authentication (uncomment when auth middleware is available)
// router.use(protect);

// Export routes
router.get('/export/csv', /* authorize('admin'), */ exportGroundsCSV);

// Public routes
router.get('/', getAllGrounds);
router.get('/availability', getAvailableGroundSlots);
router.get('/:id', getGround);

// Admin only routes
router.post('/', /* authorize('admin'), */ createGround);
router.put('/:id', /* authorize('admin'), */ updateGround);
router.delete('/:id', /* authorize('admin'), */ deleteGround);

export default router;
