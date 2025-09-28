import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Create a notification
// @route   Internal function
// @access  Internal
export const createNotification = async (notificationData) => {
    try {
        const notification = await Notification.create(notificationData);
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false, type } = req.query;
        const userId = req.user?.id || req.headers['user-id']; // Flexible user ID retrieval

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Build filter
        const filter = { userId };
        if (unreadOnly === 'true') filter.isRead = false;
        if (type) filter.type = type;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(filter)
            .populate('relatedBooking', 'bookingDate startTime endTime status amount')
            .populate('relatedGround', 'name location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalNotifications = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalNotifications,
                    pages: Math.ceil(totalNotifications / parseInt(limit))
                },
                unreadCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.headers['user-id'];

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating notification',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['user-id'];

        await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating notifications',
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.headers['user-id'];

        const notification = await Notification.findOneAndDelete({ _id: id, userId });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['user-id'];

        const stats = await Notification.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
                    byType: {
                        $push: {
                            type: '$type',
                            isRead: '$isRead'
                        }
                    }
                }
            }
        ]);

        // Group by notification type
        const typeStats = await Notification.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    unreadCount: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: stats[0] || { total: 0, unread: 0 },
                byType: typeStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching notification statistics',
            error: error.message
        });
    }
};

// Helper function to create booking notifications
export const createBookingNotification = async (type, booking, actionBy = null) => {
    try {
        let notifications = [];

        // Get all admin users
        const adminUsers = await User.find({ role: 'admin' }).select('_id');

        const bookingData = {
            customerName: `${booking.customerId?.firstName || 'Customer'} ${booking.customerId?.lastName || ''}`.trim(),
            groundName: booking.groundId?.name || 'Ground',
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime
        };

        switch (type) {
            case 'booking_created':
                // Notify all admins about new booking
                for (const admin of adminUsers) {
                    notifications.push({
                        userId: admin._id,
                        type: 'booking_created',
                        title: '🆕 New Ground Booking',
                        message: `${bookingData.customerName} has created a new booking for ${bookingData.groundName}`,
                        relatedBooking: booking._id,
                        relatedGround: booking.groundId,
                        priority: 'high',
                        metadata: bookingData
                    });
                }
                break;

            case 'booking_cancelled':
                // Notify customer and admins
                notifications.push({
                    userId: booking.customerId,
                    type: 'booking_cancelled',
                    title: '❌ Booking Cancelled',
                    message: `Your booking for ${bookingData.groundName} on ${new Date(bookingData.bookingDate).toLocaleDateString()} has been cancelled`,
                    relatedBooking: booking._id,
                    relatedGround: booking.groundId,
                    priority: 'high',
                    metadata: { ...bookingData, actionBy }
                });

                // Notify admins if cancelled by customer
                if (actionBy !== 'admin') {
                    for (const admin of adminUsers) {
                        notifications.push({
                            userId: admin._id,
                            type: 'booking_cancelled',
                            title: '❌ Booking Cancelled by Customer',
                            message: `${bookingData.customerName} cancelled their booking for ${bookingData.groundName}`,
                            relatedBooking: booking._id,
                            relatedGround: booking.groundId,
                            priority: 'medium',
                            metadata: { ...bookingData, actionBy }
                        });
                    }
                }
                break;

            case 'status_changed':
                const oldStatus = booking.metadata?.oldStatus || 'unknown';
                const newStatus = booking.status;

                // Notify customer about status change
                notifications.push({
                    userId: booking.customerId,
                    type: 'status_changed',
                    title: '📋 Booking Status Updated',
                    message: `Your booking status has been updated from "${oldStatus}" to "${newStatus}"`,
                    relatedBooking: booking._id,
                    relatedGround: booking.groundId,
                    priority: newStatus === 'confirmed' ? 'high' : 'medium',
                    metadata: {
                        ...bookingData,
                        oldStatus,
                        newStatus,
                        actionBy
                    }
                });
                break;

            case 'booking_confirmed':
                // Notify customer about confirmation
                notifications.push({
                    userId: booking.customerId,
                    type: 'booking_confirmed',
                    title: '✅ Booking Confirmed',
                    message: `Great! Your booking for ${bookingData.groundName} has been confirmed`,
                    relatedBooking: booking._id,
                    relatedGround: booking.groundId,
                    priority: 'high',
                    metadata: { ...bookingData, actionBy }
                });
                break;

            case 'booking_completed':
                // Notify customer about completion
                notifications.push({
                    userId: booking.customerId,
                    type: 'booking_completed',
                    title: '🏁 Booking Completed',
                    message: `Your booking for ${bookingData.groundName} has been completed. Thank you!`,
                    relatedBooking: booking._id,
                    relatedGround: booking.groundId,
                    priority: 'low',
                    metadata: { ...bookingData, actionBy }
                });
                break;
        }

        // Create all notifications
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            console.log(`Created ${notifications.length} notifications for booking ${booking._id}`);
        }

        return notifications;
    } catch (error) {
        console.error('Error creating booking notifications:', error);
        throw error;
    }
};
