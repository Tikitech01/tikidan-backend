const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LocationTracking = require('../models/LocationTracking');
const { verifyToken, requireRole } = require('../middleware/auth');
const { roles, getRoleDisplayName, getRoleMenuAccess } = require('../config/roles');

// Helper function to get user permissions (custom or role-based)
const getUserPermissions = (user) => {
  // If user has custom permissions, use those; otherwise use role-based permissions
  if (user.customPermissions && user.customPermissions.length > 0) {
    return user.customPermissions;
  }
  return getRoleMenuAccess(user.role);
};

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
      reportsTo,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      customPermissions
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
      reportsTo: reportsTo || null,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      customPermissions: customPermissions || []
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
    const { email, password, latitude, longitude, accuracy } = req.body;

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

    // Check if user is suspended
    if (user.status === 'Suspended by Admin') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended by admin. Please contact your administrator.'
      });
    }

    // Capture location if provided during login
    if (latitude && longitude) {
      try {
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Save location tracking data
        const savedLocation = await LocationTracking.create({
          employee: user._id,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy ? parseFloat(accuracy) : 0,
          timestamp: now,
          date: today,
          eventType: 'login'
        });
        
        console.log(`🟢 Login location captured for ${user.name}: ${latitude}, ${longitude} | EventType: ${savedLocation.eventType}`);
      } catch (locError) {
        console.error('Error saving location:', locError);
        // Don't fail login if location capture fails
      }
    }

    // Get user permissions (custom or role-based)
    const userPermissions = getUserPermissions(user);

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

    const userPermissions = getUserPermissions(user);

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

// @route   PUT /api/auth/employees/:id
// @desc    Update an employee (Admin access)
// @access  Private - Admin only
router.put('/employees/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      role,
      employeeId,
      designation,
      mobile,
      department,
      reporting,
      reportsTo,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      customPermissions
    } = req.body;

    // Find the user
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Validate role if provided
    if (role && !roles[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (employeeId) user.employeeId = employeeId;
    if (designation) user.designation = designation;
    if (mobile) user.mobile = mobile;
    if (department !== undefined) user.department = department;
    if (reporting) user.reporting = reporting;
    if (reportsTo !== undefined) user.reportsTo = reportsTo;
    if (addressLine1) user.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) user.addressLine2 = addressLine2;
    if (city) user.city = city;
    if (state) user.state = state;
    if (country) user.country = country;
    if (customPermissions !== undefined) user.customPermissions = customPermissions;

    // Update name if firstName or lastName changed
    if (firstName || lastName) {
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0];
    }

    await user.save();

    res.json({
      success: true,
      message: 'Employee updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        customPermissions: user.customPermissions
      }
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating employee',
      error: error.message
    });
  }
});

// @route   GET /api/auth/employees/:id
// @desc    Get single employee details (Admin access)
// @access  Private - Admin only
router.get('/employees/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      employee: user
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employee',
      error: error.message
    });
  }
});

// @route   PATCH /api/auth/employees/:id/suspend
// @desc    Suspend an employee (Admin access)
// @access  Private - Admin only
router.patch('/employees/:id/suspend', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admin from suspending themselves
    if (id === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend your own account'
      });
    }
    
    // Find and update the user
    const user = await User.findByIdAndUpdate(
      id, 
      { 
        status: 'Suspended by Admin',
        suspensionReason: 'Suspended by administrator'
      }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee suspended successfully',
      employee: user
    });
  } catch (error) {
    console.error('Suspend employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while suspending employee',
      error: error.message
    });
  }
});

// @route   PATCH /api/auth/employees/:id/unsuspend
// @desc    Unsuspend an employee (Admin access)
// @access  Private - Admin only
router.patch('/employees/:id/unsuspend', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and update the user
    const user = await User.findByIdAndUpdate(
      id, 
      { 
        status: 'Active',
        suspensionReason: null
      }, 
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee activated successfully',
      employee: user
    });
  } catch (error) {
    console.error('Unsuspend employee error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating employee',
      error: error.message
    });
  }
});

// @route   GET /api/auth/user-permissions
// @desc    Get current user permissions
// @access  Private
router.get('/user-permissions', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role department customPermissions');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userPermissions = getUserPermissions(user);
    
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

// @route   GET /api/auth/employees-list
// @desc    Get all employees for dropdown selection
// @access  Private - Admin only
router.get('/employees-list', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Fetch all employees with essential fields for dropdown
    const employees = await User.find({})
      .select('_id name firstName lastName email designation role employeeId')
      .sort({ name: 1 });
    
    // Format the response for dropdown
    const formattedEmployees = employees.map(employee => ({
      id: employee._id,
      name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
      email: employee.email,
      designation: employee.designation || '',
      role: employee.role,
      employeeId: employee.employeeId || ''
    }));
    
    res.json({
      success: true,
      count: formattedEmployees.length,
      employees: formattedEmployees
    });
  } catch (error) {
    console.error('Get employees list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching employees list',
      error: error.message
    });
  }
});

// @route   GET /api/auth/team-members
// @desc    Get team members (employees who report to current user) with meeting stats
// @access  Private
router.get('/team-members', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id;
    const Meeting = require('../models/Meeting');
    
    // Find all employees who report to the current user
    const teamMembers = await User.find({ reportsTo: currentUserId })
      .select('_id name firstName lastName email designation role employeeId reportsTo')
      .sort({ name: 1 });
    
    // Get meeting statistics for each team member
    const membersWithStats = await Promise.all(teamMembers.map(async (employee) => {
      // Count meetings for this employee
      const meetingCount = await Meeting.countDocuments({ 
        $or: [
          { 'attendees.email': employee.email },
          { createdBy: employee._id }
        ]
      });
      
      return {
        id: employee._id,
        name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
        email: employee.email,
        designation: employee.designation || '',
        role: employee.role,
        employeeId: employee.employeeId || '',
        meetings: meetingCount,
        average: meetingCount > 0 ? (meetingCount / 1).toFixed(1) : 'NA'
      };
    }));
    
    res.json({
      success: true,
      count: membersWithStats.length,
      teamMembers: membersWithStats
    });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: error.message
    });
  }
});

// @route   GET /api/auth/team-hierarchy
// @desc    Get team hierarchy with all reporting relationships and metrics
// @access  Private
router.get('/team-hierarchy', verifyToken, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const currentUserId = req.user._id || req.user.id;
    
    // Get current user info
    const currentUser = await User.findById(currentUserId);
    
    // Find direct reports
    const directReports = await User.find({ reportsTo: currentUserId })
      .select('_id name firstName lastName email designation role employeeId')
      .sort({ name: 1 });
    
    // Get stats for direct reports
    const reportsWithStats = await Promise.all(directReports.map(async (employee) => {
      const meetingCount = await Meeting.countDocuments({ 
        $or: [
          { 'attendees.email': employee.email },
          { createdBy: employee._id }
        ]
      });
      
      // Get employees reporting to this person (second level)
      const secondLevelReports = await User.find({ reportsTo: employee._id })
        .select('_id name email')
        .countDocuments();
      
      return {
        _id: employee._id,
        id: employee._id,
        name: employee.name || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.email,
        email: employee.email,
        designation: employee.designation || '',
        role: employee.role,
        employeeId: employee.employeeId || '',
        meetingCount: meetingCount,
        reportsCount: secondLevelReports
      };
    }));
    
    res.json({
      success: true,
      data: {
        manager: {
          name: currentUser.name,
          email: currentUser.email,
          designation: currentUser.designation,
          role: currentUser.role
        },
        directReports: reportsWithStats,
        totalDirectReports: reportsWithStats.length
      }
    });
  } catch (error) {
    console.error('Get team hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team hierarchy',
      error: error.message
    });
  }
});

// @route   GET /api/auth/available-permissions
// @desc    Get all available permissions/routes for admin to assign
// @access  Private - Admin only
router.get('/available-permissions', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const availablePermissions = [
      { value: 'dashboard', label: 'Dashboard' },
      { value: 'projects', label: 'Projects' },
      { value: 'clients', label: 'Clients' },
      { value: 'meetings', label: 'Meetings' },
      { value: 'team', label: 'Team' },
      
      // Individual expense permissions
      { value: 'expenses_view', label: 'Expenses - View/Submit' },
      { value: 'expenses_review', label: 'Expenses - Review' },
      { value: 'expenses_manage', label: 'Expenses - Manage Categories' },
      { value: 'expenses_settings', label: 'Expenses - Settings' },
      { value: 'expenses_reports', label: 'Expenses - Reports' },
      
      { value: 'profile', label: 'Profile' },
      { value: 'my_leaves', label: 'My Leave' },
      { value: 'team_leave', label: 'Team Leave' },
      { value: 'leave_settings', label: 'Leave Settings' },
      { value: 'company_profile', label: 'Company Profile' },
      { value: 'attendance', label: 'Attendance' },
      { value: 'employees', label: 'Employees' },
      { value: 'categories', label: 'Categories' },
      { value: 'department', label: 'Department' },
      { value: 'branches', label: 'Branches' },
      { value: 'holiday', label: 'Holiday' },
      { value: 'billing', label: 'Billing' }
    ];

    res.json({
      success: true,
      permissions: availablePermissions
    });
  } catch (error) {
    console.error('Get available permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available permissions',
      error: error.message
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Log user logout with location
// @access  Private
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user.id;

    // If location data provided, log the logout location
    if (latitude && longitude) {
      const logoutLoc = await LocationTracking.create({
        employee: userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: parseFloat(accuracy) || 0,
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
        eventType: 'logout' // Mark this as a logout event
      });
      
      console.log(`🔴 Logout recorded for user ${userId}: ${latitude}, ${longitude} | EventType: ${logoutLoc.eventType}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
});

module.exports = router;

