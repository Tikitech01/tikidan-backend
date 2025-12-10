const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Client = require('../models/Client');
const Project = require('../models/Project');
const { verifyToken } = require('../middleware/auth');

// Middleware to check authentication
router.use(verifyToken);

// GET dashboard metrics
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Get Total Meetings count
    const totalMeetings = await Meeting.countDocuments(dateFilter);

    // Get Total Clients count from Client collection (all active clients)
    const totalClientsInDB = await Client.countDocuments({});

    // Get Unique Clients count from meetings in date range
    const uniqueClientsInMeetings = await Meeting.distinct('client', dateFilter);
    const clientsWithMeetings = uniqueClientsInMeetings.length;

    // Use total clients from database if no date filter, otherwise use clients with meetings in range
    const clientsCount = Object.keys(dateFilter).length === 0 ? totalClientsInDB : clientsWithMeetings;

    // Get Repeat Visit count (clients with more than 1 meeting)
    const clientMeetingCounts = await Meeting.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$client',
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    const repeatVisitCount = clientMeetingCounts.reduce((sum, item) => sum + (item.count - 1), 0);

    // Get Total Quotation count (meetings with project/quotation)
    const totalQuotations = await Meeting.countDocuments({
      ...dateFilter,
      project: { $exists: true, $ne: null }
    });

    // Get Pending Quotation count (projects in negotiation/prospect stage)
    const pendingQuotations = await Project.countDocuments({
      stage: { $in: ['prospect', 'negotiation'] }
    });

    res.json({
      success: true,
      data: {
        totalMeetings,
        totalClients: clientsCount,
        repeatVisits: repeatVisitCount,
        totalQuotations,
        pendingQuotations
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
});

// GET meeting locations with details
router.get('/meeting-locations', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Get all meetings with location details
    const meetings = await Meeting.find(dateFilter)
      .populate('location', 'name address state city')
      .select('location client date type')
      .sort({ date: -1 });

    // Group by location
    const locationMap = {};

    meetings.forEach(meeting => {
      if (meeting.location) {
        const locationId = meeting.location._id.toString();
        if (!locationMap[locationId]) {
          locationMap[locationId] = {
            location: meeting.location,
            meetingCount: 0,
            uniqueClients: new Set()
          };
        }
        locationMap[locationId].meetingCount += 1;
        if (meeting.client) {
          locationMap[locationId].uniqueClients.add(meeting.client.toString());
        }
      }
    });

    // Convert Sets to arrays and format response
    const locations = Object.values(locationMap).map(loc => ({
      location: loc.location,
      totalMeetings: loc.meetingCount,
      clientsVisited: loc.uniqueClients.size
    }));

    res.json({
      success: true,
      data: locations,
      totalLocations: locations.length
    });
  } catch (error) {
    console.error('Error fetching meeting locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting locations',
      error: error.message
    });
  }
});

// GET activity report for date range
router.get('/activity', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Get activity by day
    const activities = await Meeting.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 },
          types: { $push: '$type' }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Get meeting types distribution
    const typeDistribution = await Meeting.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        dailyActivity: activities,
        typeDistribution: typeDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching activity report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity report',
      error: error.message
    });
  }
});

// GET client visit report
router.get('/client-visits', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Get client visit statistics
    const clientVisits = await Meeting.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: '$client',
          visitCount: { $sum: 1 },
          lastVisitDate: { $max: '$date' },
          firstVisitDate: { $min: '$date' }
        }
      },
      {
        $sort: { visitCount: -1 }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'clientDetails'
        }
      },
      {
        $unwind: {
          path: '$clientDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    res.json({
      success: true,
      data: clientVisits
    });
  } catch (error) {
    console.error('Error fetching client visits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch client visits',
      error: error.message
    });
  }
});

// GET project status report
router.get('/project-status', async (req, res) => {
  try {
    // Get projects by stage
    const projectsByStage = await Project.aggregate([
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get projects by type
    const projectsByType = await Project.aggregate([
      {
        $group: {
          _id: '$projectType',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get total projects and metrics
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({
      stage: { $in: ['confirmed', 'source-approved'] }
    });
    const prospectProjects = await Project.countDocuments({
      stage: { $in: ['prospect', 'negotiation'] }
    });

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        prospectProjects,
        projectsByStage,
        projectsByType
      }
    });
  } catch (error) {
    console.error('Error fetching project status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project status',
      error: error.message
    });
  }
});

// GET comprehensive dashboard report
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Fetch all metrics in parallel
    const [
      meetings,
      projects,
      clients,
      clientMeetingCounts
    ] = await Promise.all([
      Meeting.find(dateFilter).populate('location', 'name address'),
      Project.find({}),
      Client.find({}),
      Meeting.aggregate([
        {
          $match: dateFilter
        },
        {
          $group: {
            _id: '$client',
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ])
    ]);

    // Calculate metrics
    const totalMeetings = meetings.length;
    const uniqueClients = new Set(meetings.map(m => m.client?.toString()).filter(Boolean));
    const repeatVisits = clientMeetingCounts.reduce((sum, item) => sum + (item.count - 1), 0);
    const totalQuotations = meetings.filter(m => m.project).length;
    const pendingQuotations = projects.filter(p => 
      ['prospect', 'negotiation'].includes(p.stage)
    ).length;

    // Group meetings by location
    const locationMap = {};
    meetings.forEach(meeting => {
      if (meeting.location) {
        const locName = meeting.location.name;
        if (!locationMap[locName]) {
          locationMap[locName] = {
            location: meeting.location,
            count: 0
          };
        }
        locationMap[locName].count += 1;
      }
    });

    const meetingLocations = Object.values(locationMap);

    res.json({
      success: true,
      data: {
        metrics: {
          totalMeetings,
          totalClients: uniqueClients.size,
          repeatVisits,
          totalQuotations,
          pendingQuotations
        },
        meetingLocations: meetingLocations,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message
    });
  }
});

// GET employee meeting locations (for admin to track where employees are meeting clients)
router.get('/employee-locations', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const User = require('../models/User');

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      dateFilter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      dateFilter.date = { $lte: new Date(endDate) };
    }

    // Get meetings with employee and location info
    const meetings = await Meeting.find(dateFilter)
      .populate('createdBy', '_id name email designation')
      .populate('location', '_id name address city state')
      .populate('client', '_id clientName')
      .sort({ date: -1 });

    // Group meetings by employee and location
    const employeeLocationMap = {};

    meetings.forEach(meeting => {
      if (meeting.createdBy && meeting.location) {
        const employeeId = meeting.createdBy._id.toString();
        const locationId = meeting.location._id.toString();
        
        if (!employeeLocationMap[employeeId]) {
          employeeLocationMap[employeeId] = {
            employee: {
              _id: meeting.createdBy._id,
              name: meeting.createdBy.name,
              email: meeting.createdBy.email,
              designation: meeting.createdBy.designation
            },
            locations: {},
            totalMeetings: 0
          };
        }

        if (!employeeLocationMap[employeeId].locations[locationId]) {
          employeeLocationMap[employeeId].locations[locationId] = {
            location: meeting.location,
            meetingCount: 0,
            clients: new Set(),
            meetings: []
          };
        }

        employeeLocationMap[employeeId].locations[locationId].meetingCount += 1;
        employeeLocationMap[employeeId].locations[locationId].clients.add(meeting.client?.clientName || 'Unknown');
        employeeLocationMap[employeeId].locations[locationId].meetings.push({
          title: meeting.title,
          date: meeting.date,
          client: meeting.client?.clientName || 'Unknown',
          type: meeting.type
        });
        employeeLocationMap[employeeId].totalMeetings += 1;
      }
    });

    // Format response
    const employeeLocations = Object.values(employeeLocationMap).map((emp) => ({
      employee: emp.employee,
      totalMeetings: emp.totalMeetings,
      locations: Object.values(emp.locations).map((loc) => ({
        location: loc.location,
        meetingCount: loc.meetingCount,
        uniqueClients: Array.from(loc.clients).length,
        clientsList: Array.from(loc.clients),
        recentMeetings: loc.meetings.slice(0, 3)
      }))
    }));

    res.json({
      success: true,
      data: employeeLocations,
      totalEmployeesTracked: employeeLocations.length,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    console.error('Error fetching employee locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee locations',
      error: error.message
    });
  }
});

// GET meetings by employee (for admin to view specific employee meetings)
router.get('/employee-meetings/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meetings = await Meeting.find({
      createdBy: employeeId,
      ...dateFilter
    })
      .populate('client', '_id clientName')
      .populate('location', '_id name address city')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: meetings,
      totalMeetings: meetings.length
    });
  } catch (error) {
    console.error('Error fetching employee meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee meetings',
      error: error.message
    });
  }
});

// GET all meetings with GPS data (for map display)
router.get('/map/all-meetings', async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('client', '_id clientName')
      .populate('location', '_id name address city state')
      .populate('createdBy', '_id name email designation')
      .sort({ date: -1 });

    console.log(`Total meetings found: ${meetings.length}`);
    console.log('Meetings data:', JSON.stringify(meetings.map(m => ({
      _id: m._id,
      title: m.title,
      location: m.location,
      hasLocation: !!m.location
    })), null, 2));

    res.json({
      success: true,
      data: meetings,
      totalMeetings: meetings.length,
      meetingsWithLocations: meetings.filter(m => m.location && m.location._id).length
    });
  } catch (error) {
    console.error('Error fetching meetings with GPS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings with GPS data',
      error: error.message
    });
  }
});

// GET employee professional details - clients created and meetings done
router.get('/employee/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch employee info from User model (to get name and designation)
    const User = require('../models/User');
    const employee = await User.findById(id).select('name designation role');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get total clients created by this employee
    const totalClients = await Client.countDocuments({ createdBy: id });

    // Get all meetings where this employee is the createdBy/assigned user
    const meetings = await Meeting.find({ createdBy: id })
      .populate('client', 'clientName')
      .populate('location', 'name address city')
      .lean();

    const totalMeetings = meetings.length;

    res.json({
      success: true,
      data: {
        name: employee.name,
        designation: employee.designation || employee.role,
        totalClients,
        totalMeetings,
        meetings: meetings.map(m => ({
          _id: m._id,
          title: m.title,
          date: m.date,
          time: m.time,
          client: m.client,
          location: m.location,
          gpsCoordinates: m.gpsCoordinates
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details',
      error: error.message
    });
  }
});

module.exports = router;
