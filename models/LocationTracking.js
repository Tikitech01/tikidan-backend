const mongoose = require('mongoose');

const locationTrackingSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  date: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    },
    index: true
  },
  eventType: {
    type: String,
    enum: ['login', 'logout', 'tracking'],
    default: 'tracking'
  }
});

// Index for efficient querying by employee and date
locationTrackingSchema.index({ employee: 1, date: 1 });
locationTrackingSchema.index({ employee: 1, timestamp: 1 });

module.exports = mongoose.model('LocationTracking', locationTrackingSchema);
