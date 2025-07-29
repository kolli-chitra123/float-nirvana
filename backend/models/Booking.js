const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'membership', 'gift-card'],
    default: 'card'
  },
  notes: {
    type: String,
    default: ''
  },
  specialRequests: {
    type: String,
    default: ''
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: Date
  },
  cancellationReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
bookingSchema.index({ user: 1, date: 1 });
bookingSchema.index({ session: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ date: 1, time: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
