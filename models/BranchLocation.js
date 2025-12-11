const mongoose = require('mongoose');

const branchLocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  latitude: {
    type: Number,
    sparse: true
  },
  longitude: {
    type: Number,
    sparse: true
  }
}, {
  timestamps: true
});


// Virtual field to populate contacts
branchLocationSchema.virtual('contacts', {
  ref: 'ContactPerson',
  localField: '_id',
  foreignField: 'branchLocation'
});

// Index for better query performance
branchLocationSchema.index({ client: 1 });

branchLocationSchema.set('toJSON', { virtuals: true });
branchLocationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BranchLocation', branchLocationSchema);