import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  type: {
    type: String,
    enum: ['coaching', 'ground'],
    required: true
  },

  // For coaching bookings
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    default: null
  },

  // For ground bookings
  groundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ground',
    required: function () { return this.type === 'ground'; }
  },

  // Ground booking specific fields
  groundSlot: {
    type: Number,
    min: 1,
    max: 12,
    required: function () { return this.type === 'ground'; }
  },

  bookingDate: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: function () { return this.type === 'ground'; }
  },

  endTime: {
    type: String,
    required: function () { return this.type === 'ground'; }
  },

  duration: {
    type: Number, // in minutes
    required: function () { return this.type === 'ground'; }
  },

  bookingType: {
    type: String,
    enum: ['practice', 'match', 'training', 'session'],
    default: 'practice'
  },

  specialRequirements: [String],

  notes: String,

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'pending'
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null
  },

  // For legacy coaching bookings
  sessionTime: {
    type: Date,
    required: function () { return this.type === 'coaching'; }
  }

}, { timestamps: true });

// Index for better query performance
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ groundId: 1, bookingDate: 1 });
bookingSchema.index({ type: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);
