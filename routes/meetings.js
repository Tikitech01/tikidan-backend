const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const { verifyToken } = require('../middleware/auth');

// Middleware to check authentication
router.use(verifyToken);

// GET all meetings
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Get meetings created by the logged-in user
    const meetings = await Meeting.find({ createdBy: userId })
      .populate('client', 'clientName')
      .populate('contactPerson', 'name email')
      .populate('location', 'name')
      .populate('project', 'title')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meetings',
      error: error.message
    });
  }
});

// GET single meeting by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    const meeting = await Meeting.findById(req.params.id)
      .populate('client', 'clientName')
      .populate('contactPerson', 'name email')
      .populate('location', 'name')
      .populate('project', 'title')
      .populate('createdBy', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has permission to view this meeting
    if (meeting.createdBy._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this meeting'
      });
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting',
      error: error.message
    });
  }
});

// CREATE new meeting
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      title,
      date,
      time,
      duration,
      location,
      type,
      status,
      client,
      contactPerson,
      project,
      products,
      comments,
      attendees,
      meetingNotes,
      followUpRequired,
      gpsCoordinates
    } = req.body;

    // Validate required fields
    if (!date || !time || !client) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and client are required'
      });
    }

    // Generate title if not provided
    const meetingTitle = title || `Meeting - ${new Date(date).toLocaleDateString()}`;

    // Create new meeting with GPS coordinates
    const newMeeting = new Meeting({
      title: meetingTitle,
      date: new Date(date),
      time,
      duration: duration || 60,
      location: location || null,
      type: type || 'Other',
      status: status || 'scheduled',
      client,
      contactPerson: contactPerson || null,
      project: project || null,
      products: products || [],
      comments: comments || '',
      attendees: attendees || [],
      meetingNotes: meetingNotes || '',
      followUpRequired: followUpRequired || false,
      createdBy: userId,
      gpsCoordinates: gpsCoordinates ? {
        latitude: gpsCoordinates.latitude,
        longitude: gpsCoordinates.longitude,
        accuracy: gpsCoordinates.accuracy || null,
        capturedAt: new Date()
      } : null
    });

    const savedMeeting = await newMeeting.save();

    // Populate references
    const populatedMeeting = await Meeting.findById(savedMeeting._id)
      .populate('client', 'clientName')
      .populate('contactPerson', 'name email')
      .populate('location', 'name')
      .populate('project', 'title')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: populatedMeeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meeting',
      error: error.message
    });
  }
});

// UPDATE meeting by ID
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Check if meeting exists and user owns it
    const existingMeeting = await Meeting.findById(req.params.id);
    if (!existingMeeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (existingMeeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this meeting'
      });
    }

    const {
      title,
      date,
      time,
      duration,
      location,
      type,
      status,
      client,
      contactPerson,
      project,
      products,
      comments,
      attendees,
      meetingNotes,
      followUpRequired
    } = req.body;

    // Validate required fields
    if (!date || !time || !client) {
      return res.status(400).json({
        success: false,
        message: 'Date, time, and client are required'
      });
    }

    // Generate title if not provided
    const meetingTitle = title || `Meeting - ${new Date(date).toLocaleDateString()}`;

    const updateData = {
      title: meetingTitle,
      date: new Date(date),
      time,
      duration: duration || 60,
      location: location || null,
      type: type || 'Other',
      status: status || 'scheduled',
      client,
      contactPerson: contactPerson || null,
      project: project || null,
      products: products || [],
      comments: comments || '',
      attendees: attendees || [],
      meetingNotes: meetingNotes || '',
      followUpRequired: followUpRequired || false
    };

    const updatedMeeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('client', 'clientName')
     .populate('contactPerson', 'name email')
     .populate('location', 'name')
     .populate('project', 'title')
     .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
});

// DELETE meeting by ID
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Check if meeting exists and user owns it
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meeting.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this meeting'
      });
    }

    await Meeting.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meeting',
      error: error.message
    });
  }
});

module.exports = router;
