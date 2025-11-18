const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const { roles, getRoleDisplayName, getRoleMenuAccess } = require('../config/roles');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default role
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user' // Default role
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/register-employee
// @desc    Register a new employee
// @access  Public (should be protected in production)
router.post('/register-employee', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      employeeId,
      designation,
      mobile,
      department,
      reporting,
      addressLine1,
      addressLine2,
      city,
      state,
      country
    } = req.body;

    // Validation - only require essential fields for testing
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and role'
      });
    }

    // Validate role exists
    if (!roles[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create full name from firstName and lastName if provided
    const name = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || email.split('@')[0]);

    // Create employee user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      employeeId,
      firstName,
      lastName,
      designation,
      mobile,
      department: department || '', // No default department
      reporting,
      addressLine1,
      addressLine2,
      city,
      state,
      country
    });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Employee registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during employee registration',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get user permissions
    const userPermissions = getRoleMenuAccess(user.role);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: userPermissions,
        displayName: getRoleDisplayName(user.role)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user with permissions
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userPermissions = getRoleMenuAccess(user.role);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        permissions: userPermissions,
        displayName: getRoleDisplayName(user.role)
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/auth/employees
// @desc    Get all employees (Admin access)
// @access  Private - Admin only
router.get('/employees', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Fetch all users from database, excluding password
    const employees = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: employees.length,
      employees: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees',
      error: error.message
    });
  }
});

// @route   DELETE /api/auth/employees/:id
// @desc    Delete an employee (Admin access)
// @access  Private - Admin only
router.delete('/employees/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    // Find and delete the user
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting employee',
      error: error.message
    });
  }
});

// @route   GET /api/auth/user-permissions
// @desc    Get current user permissions
// @access  Private
router.get('/user-permissions', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role department');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userPermissions = getRoleMenuAccess(user.role);
    
    res.json({
      success: true,
      permissions: userPermissions,
      role: user.role,
      displayName: getRoleDisplayName(user.role)
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching permissions',
      error: error.message
    });
  }
});

module.exports = router;
