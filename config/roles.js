// Role Configuration for Tikidan SaaS
const roles = {
  // Management Roles
  'deputy_manager': {
    displayName: 'Deputy Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'assistant_manager': {
    displayName: 'Assistant Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'manager': {
    displayName: 'Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'senior_manager': {
    displayName: 'Senior Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'senior_management'
  },
  'sales_manager': {
    displayName: 'Sales Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'president': {
    displayName: 'President',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'team', 'expenses', 'profile', 'my_leaves'],
    level: 'executive'
  },
  'marketing_coordinator': {
    displayName: 'Marketing Coordinator',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'expenses', 'profile', 'my_leaves'],
    level: 'executive'
  },
  'agm': {
    displayName: 'AGM',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'senior_management'
  },
  'executive': {
    displayName: 'Executive',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'expenses', 'profile', 'my_leaves'],
    level: 'executive'
  },
  'accounts_executive': {
    displayName: 'Accounts Executive',
    department: '',
    menuAccess: ['dashboard', 'expenses', 'profile', 'my_leaves'],
    level: 'executive'
  },
  'zonal_manager': {
    displayName: 'Zonal Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'technical_head': {
    displayName: 'Technical Head',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'tester': {
    displayName: 'Tester',
    department: '',
    menuAccess: ['dashboard', 'projects', 'expenses', 'profile', 'my_leaves'],
    level: 'staff'
  },
  'territory_manager': {
    displayName: 'Territory Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'expenses', 'profile', 'my_leaves'],
    level: 'management'
  },
  'sr_general_manager': {
    displayName: 'Sr. General Manager',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'senior_management'
  },
  'business_head': {
    displayName: 'Business Head',
    department: '',
    menuAccess: ['dashboard', 'projects', 'clients', 'meetings', 'expenses', 'profile', 'my_leaves'],
    level: 'executive'
  },

  // System Roles
  'admin': {
    displayName: 'Administrator',
    department: '',
    menuAccess: ['*'], // Full access
    level: 'system'
  },
  'user': {
    displayName: 'User',
    department: '',
    menuAccess: ['dashboard', 'expenses', 'profile', 'my_leaves'],
    level: 'basic'
  }
};

// Department configuration
const departments = {
  'sales': 'Sales',
  'marketing': 'Marketing',
  'hr': 'Human Resources',
  'finance': 'Finance',
  'it': 'Information Technology',
  'operations': 'Operations',
  'specifications': 'Specifications',
  'business_development': 'Business Development',
  'accounts': 'Accounts',
  'technical': 'Technical',
  'testing': 'Testing',
  'territory': 'Territory',
  'general_management': 'General Management',
  'head_office': 'Head Office',
  '': 'No Department'
};

// Get role display name
const getRoleDisplayName = (role) => {
  return roles[role]?.displayName || role;
};

// Get role department
const getRoleDepartment = (role) => {
  return roles[role]?.department || '';
};

// Get role menu access
const getRoleMenuAccess = (role) => {
  return roles[role]?.menuAccess || ['dashboard'];
};

// Check if user has access to menu item
const hasMenuAccess = (role, menuItem) => {
  const access = getRoleMenuAccess(role);
  return access.includes('*') || access.includes(menuItem);
};

// Get all roles with their display names
const getAllRoles = () => {
  return Object.keys(roles).map(role => ({
    key: role,
    displayName: roles[role].displayName,
    department: roles[role].department,
    departmentName: departments[roles[role].department],
    level: roles[role].level
  }));
};

// Get roles by department
const getRolesByDepartment = (department) => {
  return Object.keys(roles)
    .filter(role => roles[role].department === department)
    .map(role => ({
      key: role,
      displayName: roles[role].displayName,
      level: roles[role].level
    }));
};

// Get role display name with department (if assigned)
const getRoleWithDepartment = (role, userDepartment = '') => {
  const roleData = roles[role];
  if (!roleData) return role;
  
  const displayName = roleData.displayName;
  const department = userDepartment;
  
  // If no department is assigned, return just the role name
  if (!department) return displayName;
  
  // If department exists, return "Role - Department" format
  const departmentName = departments[department] || department;
  return `${displayName} - ${departmentName}`;
};

module.exports = {
  roles,
  departments,
  getRoleDisplayName,
  getRoleDepartment,
  getRoleMenuAccess,
  hasMenuAccess,
  getAllRoles,
  getRolesByDepartment,
  getRoleWithDepartment
};