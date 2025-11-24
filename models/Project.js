const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Planning'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  teamMembers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  }],
  milestones: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    dueDate: {
      type: Date
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: Date
    }
  }],
  deliverables: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Approved', 'Rejected'],
      default: 'Pending'
    }
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1 });

module.exports = mongoose.model('Project', projectSchema);