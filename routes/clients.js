const express = require('express');
const mongoose = require('mongoose');
const Client = require('../models/Client');
const BranchLocation = require('../models/BranchLocation');
const ContactPerson = require('../models/ContactPerson');
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/clients
// @desc    Get all clients created by the authenticated user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('Fetching clients for user:', req.user._id);
    
    // If user is admin, fetch all clients; else only those created by the user
    const query = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const clients = await Client.find(query)
      .populate({
        path: 'locations',
        populate: {
          path: 'contacts',
          model: 'ContactPerson'
        }
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    console.log(`Found ${clients.length} clients`);

    // Add meeting and project counts
    const clientsWithCounts = await Promise.all(
      clients.map(async (client) => {
        const meetingCount = await Meeting.countDocuments({ client: client._id });
        const projectCount = await Project.countDocuments({ client: client._id });
        
        // Transform the data structure to match frontend expectations
        return {
          _id: client._id,
          id: client._id.toString(),
          category: client.category,
          clientName: client.clientName,
          salesPerson:
            client.createdBy && (client.createdBy.name || client.createdBy.email)
              ? (client.createdBy.name ? client.createdBy.name : client.createdBy.email)
              : 'Not assigned',
          status: client.status,
          totalMeetings: meetingCount,
          totalProjects: projectCount,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          locations: client.locations ? client.locations.map(location => ({
            _id: location._id,
            id: location._id.toString(),
            name: location.name,
            addressLine1: location.addressLine1,
            addressLine2: location.addressLine2,
            city: location.city,
            state: location.state,
            country: location.country,
            contacts: location.contacts ? location.contacts.map(contact => ({
              _id: contact._id,
              id: contact._id.toString(),
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              designation: contact.designation
            })) : []
          })) : []
        };
      })
    );

    res.status(200).json({
      success: true,
      count: clientsWithCounts.length,
      data: clientsWithCounts
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clients',
      error: error.message
    });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client created by the authenticated user
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    })
      .populate({
        path: 'locations',
        model: 'BranchLocation',
        populate: {
          path: 'contacts',
          model: 'ContactPerson'
        }
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Get related meetings and projects
    const meetings = await Meeting.find({ client: client._id }).sort({ date: -1 });
    const projects = await Project.find({ client: client._id }).sort({ createdAt: -1 });

    // Transform the data structure to match frontend expectations
    const transformedClient = {
      _id: client._id,
      id: client._id.toString(),
      category: client.category,
      clientName: client.clientName,
      salesPerson: client.salesPerson,
      status: client.status,
      totalMeetings: meetings.length,
      totalProjects: projects.length,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      locations: client.locations ? client.locations.map(location => ({
        _id: location._id,
        id: location._id.toString(),
        name: location.name,
        addressLine1: location.addressLine1,
        addressLine2: location.addressLine2,
        city: location.city,
        state: location.state,
        country: location.country,
        contacts: location.contacts ? location.contacts.map(contact => ({
          _id: contact._id,
          id: contact._id.toString(),
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation
        })) : []
      })) : []
    };

    res.status(200).json({
      success: true,
      data: {
        client: transformedClient,
        meetings,
        projects
      }
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client',
      error: error.message
    });
  }
});

// @route   POST /api/clients
// @desc    Create a new client with locations and contacts
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  console.log('Received POST request to /api/clients');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('Creating client for user:', req.user._id);
  
  try {
    const { category, clientName, salesPerson, locations } = req.body;
    console.log('Extracted data:', { category, clientName, salesPerson, locations });

    // Validate createdBy
    if (!req.user || !req.user._id) {
      console.error('Missing req.user or req.user._id!');
      return res.status(401).json({ success: false, message: 'User authentication failed, cannot set createdBy.' });
    }

    // Create client with the authenticated user as creator
    const client = new Client({
      category,
      clientName,
      salesPerson,
      createdBy: req.user._id
    });
    console.log('Client object created:', client);

    await client.save();
    console.log('Client saved successfully with ID:', client._id, 'createdBy:', client.createdBy);

    const createdLocations = [];
    const createdContacts = [];

    // Create locations and contacts if provided
    if (locations && locations.length > 0) {
      console.log(`Processing ${locations.length} locations...`);
      
      for (const locationData of locations) {
        console.log('Processing location:', locationData.name);
        
        const location = new BranchLocation({
          name: locationData.name,
          addressLine1: locationData.addressLine1,
          addressLine2: locationData.addressLine2 || '',
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          client: client._id
        });

        await location.save();
        console.log('Location saved with ID:', location._id);
        createdLocations.push(location);

        // Create contacts for this location
        if (locationData.contacts && locationData.contacts.length > 0) {
          console.log(`Processing ${locationData.contacts.length} contacts for location ${location.name}...`);
          
          for (const contactData of locationData.contacts) {
            console.log('Processing contact:', contactData.name);
            
            const contact = new ContactPerson({
              name: contactData.name,
              email: contactData.email,
              phone: contactData.phone,
              designation: contactData.designation || '',
              branchLocation: location._id
            });

            await contact.save();
            console.log('Contact saved with ID:', contact._id);
            createdContacts.push(contact);
          }
        }
      }
    }

    console.log('All data saved successfully');

    // Fetch the complete client with populated data and transform structure
    const populatedClient = await Client.findById(client._id)
      .populate({
        path: 'locations',
        model: 'BranchLocation',
        match: { client: client._id },
        populate: {
          path: 'contacts',
          model: 'ContactPerson'
        }
      });
      
    console.log('Raw populated client:', JSON.stringify(populatedClient, null, 2));
        
    // Transform the data structure to match frontend expectations
    const transformedClient = {
      _id: populatedClient._id,
      id: populatedClient._id.toString(),
      category: populatedClient.category,
      clientName: populatedClient.clientName,
      salesPerson: populatedClient.salesPerson,
      status: populatedClient.status,
      totalMeetings: 0,
      totalProjects: 0,
      createdAt: populatedClient.createdAt,
      updatedAt: populatedClient.updatedAt,
      locations: populatedClient.locations ? populatedClient.locations.map(location => ({
        _id: location._id,
        id: location._id.toString(),
        name: location.name,
        addressLine1: location.addressLine1,
        addressLine2: location.addressLine2,
        city: location.city,
        state: location.state,
        country: location.country,
        contacts: location.contacts ? location.contacts.map(contact => ({
          _id: contact._id,
          id: contact._id.toString(),
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          designation: contact.designation
        })) : []
      })) : []
    };
    
    console.log('Transformed client:', JSON.stringify(transformedClient, null, 2));
    console.log('Client populated successfully');

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: transformedClient
    });
    
    console.log('Response sent successfully');
    
  } catch (error) {
    console.error('=== ERROR IN CLIENT CREATION ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    console.error('Request body was:', req.body);
    
    res.status(500).json({
      success: false,
      message: 'Internal server error creating client',
      error: error.message,
      details: error.errors || error.toString()
    });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client (only if created by authenticated user)
// @access  Private
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { category, clientName, salesPerson, status } = req.body;

    // Only allow update if client belongs to the authenticated user
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { category, clientName, salesPerson, status },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating client',
      error: error.message
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client with cascade deletion of all related data (only if created by authenticated user)
// @access  Private
router.delete('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const clientId = req.params.id;

    // Check if client exists and belongs to the authenticated user
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.user._id
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found or access denied'
      });
    }

    // Find all branch locations for this client
    const branchLocations = await BranchLocation.find({ client: clientId });
    const branchLocationIds = branchLocations.map(loc => loc._id);

    // Delete all related data in cascade manner
    const cascadeDeletions = [];

    // 1. Delete all contact persons (linked to branch locations)
    if (branchLocationIds.length > 0) {
      cascadeDeletions.push(
        ContactPerson.deleteMany({ branchLocation: { $in: branchLocationIds } }, { session })
      );
    }

    // 2. Delete all meetings associated with the client
    cascadeDeletions.push(
      Meeting.deleteMany({ client: clientId }, { session })
    );

    // 3. Delete all projects associated with the client
    cascadeDeletions.push(
      Project.deleteMany({ client: clientId }, { session })
    );

    // 4. Delete all branch locations
    cascadeDeletions.push(
      BranchLocation.deleteMany({ client: clientId }, { session })
    );

    // 5. Finally, delete the client itself
    cascadeDeletions.push(
      Client.findByIdAndDelete(clientId, { session })
    );

    // Execute all deletions
    await Promise.all(cascadeDeletions);

    await session.commitTransaction();
    session.endSession();

    console.log(`Client ${client.clientName} and all related data deleted successfully`);
    
    res.status(200).json({
      success: true,
      message: `Client "${client.clientName}" and all related data deleted successfully`,
      data: {
        clientName: client.clientName,
        deletedItems: {
          branchLocations: branchLocations.length,
          contactPersons: branchLocations.reduce((sum, loc) => sum + loc.contacts?.length || 0, 0),
          meetings: 0, // Will be calculated in production
          projects: 0  // Will be calculated in production
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client and related data',
      error: error.message
    });
  }
});

module.exports = router;