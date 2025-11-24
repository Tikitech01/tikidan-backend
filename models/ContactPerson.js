const mongoose = require('mongoose');

const contactPersonSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  branchLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BranchLocation',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactPerson', contactPersonSchema);