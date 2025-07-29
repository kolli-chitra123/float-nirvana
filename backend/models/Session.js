const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 30,
    max: 180
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['relaxation', 'therapy', 'meditation', 'wellness']
  },
  benefits: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxCapacity: {
    type: Number,
    default: 1,
    min: 1
  },
  equipment: [{
    type: String
  }],
  requirements: [{
    type: String
  }],
  imageUrl: {
    type: String,
    default: ''
  },
  schedule: {
    type: Map,
    of: [{
      time: String,
      available: Boolean,
      booked: Boolean,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }
}, {
  timestamps: true
});

// Index for better query performance
sessionSchema.index({ category: 1, isActive: 1 });
sessionSchema.index({ price: 1 });

module.exports = mongoose.model('Session', sessionSchema);
