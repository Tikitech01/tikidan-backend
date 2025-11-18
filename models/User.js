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
    enum: ['user', 'admin', 'sales_manager', 'vice_admin', 'senior_manager', 'team_lead', 'project_manager', 'hr_manager', 'finance_manager', 'operations_manager', 'marketing_manager', 'it_manager', 'executive', 'assistant_manager'],
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
    enum: ['sales', 'marketing', 'hr', 'finance', 'it', 'operations', ''],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
