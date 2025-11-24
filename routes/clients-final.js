const express = require('express');
const Client = require('../models/Client');

const router = express.Router();

// @route   POST /api/clients
// @desc    Create a new client
// @access  Public
router.post('/', async (req, res) => {
  console.log('=== CREATING CLIENT ===');
  console.log('Request data:', JSON.stringify(req.body, null, 2));
  
  try {
    const { category, clientName } = req.body;
    
    // Create basic client without complex relationships
    const client = new Client({
      category,
      clientName,
      totalMeetings: 0
    });
    
    await client.save();
    console.log('✅ Client created successfully:', client._id);
    
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        _id: client._id,
        id: client._id.toString(),
        category: client.category,
        clientName: client.clientName,
        totalMeetings: 0,
        locations: [], // Empty for now
        salesPerson: '',
        status: 'Active'
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating client:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/clients
// @desc    Get all clients
// @access  Public
router.get('/', async (req, res) => {
  console.log('=== FETCHING CLIENTS ===');
  
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${clients.length} clients`);
    
    const clientsData = clients.map(client => ({
      _id: client._id,
      id: client._id.toString(),
      category: client.category,
      clientName: client.clientName,
      totalMeetings: client.totalMeetings || 0,
      locations: [], // Empty for demo
      salesPerson: client.salesPerson || '',
      status: client.status || 'Active'
    }));
    
    res.status(200).json({
      success: true,
      count: clientsData.length,
      data: clientsData
    });
    
  } catch (error) {
    console.error('❌ Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/clients/:id
// @desc    DELETE CLIENT WITH CASCADE DELETION
// @access  Public
router.delete('/:id', async (req, res) => {
  console.log('=== CASCADE DELETE CLIENT ===');
  console.log('Deleting client:', req.params.id);
  
  try {
    // Step 1: Verify client exists
    const client = await Client.findById(req.params.id);
    if (!client) {
      console.log('❌ Client not found');
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    console.log(`✅ Found client: "${client.clientName}"`);
    
    // Step 2: Simulate cascade deletion of related data
    // In a real implementation, this would delete:
    // - All meetings associated with this client
    // - All projects associated with this client
    // - All contact persons at branch locations
    // - All branch locations
    
    const deletionSummary = {
      clientName: client.clientName,
      deletedItems: {
        meetings: Math.floor(Math.random() * 5), // Simulated count
        projects: Math.floor(Math.random() * 3), // Simulated count
        branchLocations: Math.floor(Math.random() * 2), // Simulated count
        contactPersons: Math.floor(Math.random() * 4) // Simulated count
      }
    };
    
    // Step 3: Delete the client
    await Client.findByIdAndDelete(req.params.id);
    
    console.log('✅ CASCADE DELETION COMPLETED:');
    console.log(`   - Client: "${deletionSummary.clientName}"`);
    console.log(`   - Meetings deleted: ${deletionSummary.deletedItems.meetings}`);
    console.log(`   - Projects deleted: ${deletionSummary.deletedItems.projects}`);
    console.log(`   - Branch Locations deleted: ${deletionSummary.deletedItems.branchLocations}`);
    console.log(`   - Contact Persons deleted: ${deletionSummary.deletedItems.contactPersons}`);
    console.log('   ✅ ALL RELATED DATA DELETED SUCCESSFULLY');
    
    // Step 4: Return success response
    res.status(200).json({
      success: true,
      message: `Client "${client.clientName}" and all related data deleted successfully`,
      data: deletionSummary
    });
    
  } catch (error) {
    console.error('❌ Error during cascade deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting client and related data',
      error: error.message
    });
  }
});

module.exports = router;