import express from 'express';
const router = express.Router();
import {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationStats
} from '../controllers/notificationController.js';

// All routes for notifications
router.get('/', getUserNotifications);
router.get('/stats', getNotificationStats);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);
router.delete('/:id', deleteNotification);

export default router;
