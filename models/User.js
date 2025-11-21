const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6
  },
  role: {
    type: String,
    enum: [
      'user', 'admin',
      'deputy_manager', 'assistant_manager', 'manager',
      'senior_manager', 'sales_manager', 'president', 'marketing_coordinator', 'agm',
      'executive', 'accounts_executive', 'zonal_manager',
      'technical_head', 'tester', 'territory_manager', 'sr_general_manager', 'business_head'
    ],
    default: 'user'
  },
  // Employee specific fields
  employeeId: {
    type: String,
    sparse: true,
    unique: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    enum: ['sales', 'marketing', 'hr', 'finance', 'it', 'operations', 'specifications', 'business_development', 'accounts', 'technical', 'testing', '', 'territory', 'general_management', 'head_office'],
    default: ''
  },
  reporting: {
    type: String,
    enum: ['self', 'manager', 'supervisor', 'director', ''],
    default: ''
  },
  // Address fields
  addressLine1: {
    type: String,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  // Custom permissions array for dynamic permission assignment
  customPermissions: {
    type: [String],
    default: []
  },
  // Reference to the manager/leader this employee reports to
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended by Admin'],
    default: 'Active'
  },
  suspensionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
