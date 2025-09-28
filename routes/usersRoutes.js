import express from 'express';
const router = express.Router();

// Import all the correct, specific controller functions
import {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    createUserByAdmin,
    updateUserByAdmin,
    deleteUserByAdmin,
    updateUserStatusByAdmin,
} from '../controllers/usersController.js';

// Import the security middleware
import { protect, authorizeRoles } from '../utils/protect.js';

// --- Routes for a user managing their OWN profile ---
// Any logged-in user can access these.
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// --- ADMIN-ONLY Routes ---
// Only users with the 'admin' role can access these routes.
router.route('/')
    .get(getAllUsers) // Temporarily remove auth for development
    .post(protect, authorizeRoles('admin'), createUserByAdmin);

router.route('/:id')
    .get(protect, authorizeRoles('admin'), getUserById)
    .put(protect, authorizeRoles('admin'), updateUserByAdmin)
    .delete(protect, authorizeRoles('admin'), deleteUserByAdmin);

// --- ADMIN-ONLY ROUTE TO UPDATE USER STATUS ---
router.put('/:id/status', protect, authorizeRoles('admin'), updateUserStatusByAdmin);


export default router;
