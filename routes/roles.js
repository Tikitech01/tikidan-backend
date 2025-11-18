const express = require('express');
const router = express.Router();
const {
  roles,
  departments,
  getAllRoles,
  getRolesByDepartment,
  getRoleDisplayName,
  getRoleDepartment,
  getRoleWithDepartment
} = require('../config/roles');

// Menu route mapping - connects backend menuAccess to frontend routes
const MENU_ROUTE_MAPPING = {
  'dashboard': '/reports',
  'projects': '/projects',
  'clients': '/clients',
  'meetings': '/meetings',
  'expenses': '/expenses',
  'profile': '/profile',
  'my_leaves': '/my-leave',
  'team': '/team',
  'company': '/company',
  'attendance': '/attendance',
  'employees': '/employees',
  'categories': '/categories',
  'department': '/department',
  'branches': '/branches',
  'holiday': '/holiday',
  'billing': '/billing'
};

// Get all roles
router.get('/roles', (req, res) => {
  try {
    const allRoles = getAllRoles();
    res.json({
      success: true,
      data: allRoles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
});

// Get all departments
router.get('/departments', (req, res) => {
  try {
    const allDepartments = Object.keys(departments).map(key => ({
      key: key,
      name: departments[key]
    }));
    res.json({
      success: true,
      data: allDepartments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
});

// Get roles by department
router.get('/roles/department/:department', (req, res) => {
  try {
    const { department } = req.params;
    const rolesInDepartment = getRolesByDepartment(department);
    res.json({
      success: true,
      data: rolesInDepartment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching roles by department',
      error: error.message
    });
  }
});

// Get role display name
router.get('/roles/:role/display-name', (req, res) => {
  try {
    const { role } = req.params;
    const displayName = getRoleDisplayName(role);
    res.json({
      success: true,
      data: { displayName }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role display name',
      error: error.message
    });
  }
});

// Get user role-department display format
router.get('/users/:userId/role-display', (req, res) => {
  try {
    const { userId } = req.params;
    // This would be used in conjunction with User model
    // For now, return the format structure
    res.json({
      success: true,
      data: {
        format: 'role - department',
        example: 'Manager - Sales',
        note: 'If no department is assigned, only role is shown'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role display format',
      error: error.message
    });
  }
});

// Update user role and department
router.put('/users/:userId/role', (req, res) => {
  try {
    const { userId } = req.params;
    const { role, department } = req.body;
    
    // Validate role exists
    if (!roles[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }
    
    // Validate department exists
    if (!departments[department] && department !== '') {
      return res.status(400).json({
        success: false,
        message: 'Invalid department provided'
      });
    }
    
    // Here you would update the user in the database
    // For now, return success message
    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId,
        role,
        department,
        displayName: getRoleDisplayName(role),
        formattedDisplay: department ? `${getRoleDisplayName(role)} - ${departments[department]}` : getRoleDisplayName(role)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// Get role permissions/menu access
router.get('/roles/:role/permissions', (req, res) => {
  try {
    const { role } = req.params;
    
    if (!roles[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }
    
    const roleData = roles[role];
    res.json({
      success: true,
      data: {
        role,
        displayName: roleData.displayName,
        department: roleData.department,
        departmentName: departments[roleData.department],
        menuAccess: roleData.menuAccess,
        level: roleData.level
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching role permissions',
      error: error.message
    });
  }
});

module.exports = router;