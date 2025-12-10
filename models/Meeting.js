const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BranchLocation'
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
  contactPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactPerson'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  products: [{
    type: String,
    trim: true
  }],
  comments: {
    type: String,
    trim: true
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
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // GPS coordinates for location verification
  gpsCoordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    accuracy: {
      type: Number,
      description: 'Accuracy of GPS reading in meters'
    },
    capturedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
meetingSchema.index({ client: 1 });
meetingSchema.index({ date: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);