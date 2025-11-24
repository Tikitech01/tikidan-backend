const express = require('express');
const Client = require('../models/Client');

const router = express.Router();

// @route   POST /api/clients
// @desc    Create a new client
// @access  Public
router.post('/', async (req, res) => {
  console.log('=== SIMPLE CLIENT CREATION ===');
  console.log('Received request:', req.body);
  
  try {
    const { category, clientName } = req.body;
    
    console.log('Creating client with:', { category, clientName });
    
    // Create basic client
    const client = new Client({
      category,
      clientName
    });
    
    console.log('Client object created:', client);
    
    await client.save();
    console.log('Client saved successfully with ID:', client._id);
    
    // Return simple response without population
    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        _id: client._id,
        id: client._id.toString(),
        category: client.category,
        clientName: client.clientName,
        locations: [],
        totalMeetings: 0
      }
    });
    
    console.log('Response sent successfully');
    
  } catch (error) {
    console.error('=== ERROR IN CLIENT CREATION ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
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
  console.log('Fetching all clients...');
  
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    console.log(`Found ${clients.length} clients`);
    
    // Return simple response without population
    const clientsData = clients.map(client => ({
      _id: client._id,
      id: client._id.toString(),
      category: client.category,
      clientName: client.clientName,
      totalMeetings: client.totalMeetings || 0,
      locations: [],
      status: client.status || 'Active'
    }));
    
    res.status(200).json({
      success: true,
      count: clientsData.length,
      data: clientsData
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

// @route   DELETE /api/clients/:id
// @desc    Delete client (simple version)
// @access  Public
router.delete('/:id', async (req, res) => {
  console.log('Deleting client:', req.params.id);
  
  try {
    const client = await Client.findById(req.params.id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    await Client.findByIdAndDelete(req.params.id);
    
    console.log('Client deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting client',
      error: error.message
    });
  }
});

module.exports = router;