const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  location: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Initial Consultation', 'Follow-up', 'Presentation', 'Training', 'Support', 'Other'],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['scheduled', 'pending', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  attendees: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      trim: true
    }
  }],
  meetingNotes: {
    type: String,
    trim: true
  },
  followUpRequired: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
meetingSchema.index({ client: 1 });
meetingSchema.index({ date: 1 });
meetingSchema.index({ status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);