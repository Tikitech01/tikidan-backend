const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  projectType: {
    type: String,
    enum: ['residential', 'hospital', 'hotel', 'commercial space', 'airport', 'railway', 'mes', 'landmark project'],
    trim: true
  },
  contractor: {
    type: String,
    trim: true
  },
  consultant: {
    type: String,
    trim: true
  },
  sizeOfProject: {
    type: Number,
    min: 0,
    description: 'Size in SQM (Square Meters)'
  },
  products: [{
    type: String,
    enum: ['Waterproofing Membranes', 'Acoustic insulation', 'Spray', 'Coatings', 'Drainage boards', 'Thermal Insulation', 'Floorings']
  }],
  stage: {
    type: String,
    enum: ['suspect', 'prospect', 'source-approver-submission', 'source-approved', 'negotiation', 'confirmed'],
    trim: true
  },
  assignTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  description: {
    type: String,
    trim: true
  },
  meeting: {
    type: String,
    trim: true
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ createdBy: 1 });
projectSchema.index({ assignTo: 1 });
projectSchema.index({ stage: 1 });
projectSchema.index({ startDate: 1 });

module.exports = mongoose.model('Project', projectSchema);