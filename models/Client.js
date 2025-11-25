const mongoose = require('mongoose');
const BranchLocation = require('./BranchLocation');

const clientSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Enterprise', 'SMB', 'Startup', 'Government', 'Non-Profit', 'Other']
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  totalMeetings: {
    type: Number,
    default: 0,
    min: 0
  },
  salesPerson: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Enforce createdBy for all new clients
  }
}, {
  timestamps: true
});

// Virtual field to populate locations
clientSchema.virtual('locations', {
  ref: 'BranchLocation',
  localField: '_id',
  foreignField: 'client'
});

// Index for better query performance
clientSchema.index({ clientName: 1 });
clientSchema.index({ category: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ createdBy: 1 });

// Make virtuals included in JSON output
clientSchema.set('toJSON', { virtuals: true });
clientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Client', clientSchema);