import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['booking_created', 'booking_updated', 'booking_cancelled', 'booking_confirmed', 'booking_completed', 'status_changed'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedBooking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        default: null
    },
    relatedGround: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ground',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    metadata: {
        oldStatus: String,
        newStatus: String,
        customerName: String,
        groundName: String,
        bookingDate: Date,
        startTime: String,
        endTime: String,
        actionBy: String // who performed the action
    }
}, { timestamps: true });

// Indexes for better performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });

export default mongoose.model('Notification', notificationSchema);
