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
    const { category, clientName, locations = [] } = req.body;

    // Create client
    const client = new Client({
      category,
      clientName,
      totalMeetings: 0
    });
    await client.save();
    console.log('✅ Client created successfully:', client._id);

    // Create branch locations and contact persons
    const BranchLocation = require('../models/BranchLocation');
    const ContactPerson = require('../models/ContactPerson');
    let savedLocations = [];

    for (const loc of locations) {
      const branchLocation = new BranchLocation({
        name: loc.name,
        addressLine1: loc.addressLine1,
        addressLine2: loc.addressLine2,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        client: client._id
      });
      await branchLocation.save();

      // Save contact persons for this location
      let savedContacts = [];
      if (Array.isArray(loc.contacts)) {
        for (const contact of loc.contacts) {
          const contactPerson = new ContactPerson({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            designation: contact.designation,
            branchLocation: branchLocation._id
          });
          await contactPerson.save();
          savedContacts.push({
            _id: contactPerson._id,
            name: contactPerson.name,
            email: contactPerson.email,
            phone: contactPerson.phone,
            designation: contactPerson.designation
          });
        }
      }
      savedLocations.push({
        _id: branchLocation._id,
        name: branchLocation.name,
        addressLine1: branchLocation.addressLine1,
        addressLine2: branchLocation.addressLine2,
        city: branchLocation.city,
        state: branchLocation.state,
        country: branchLocation.country,
        contacts: savedContacts
      });
    }

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: {
        _id: client._id,
        id: client._id.toString(),
        category: client.category,
        clientName: client.clientName,
        totalMeetings: 0,
        locations: savedLocations,
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
    const BranchLocation = require('../models/BranchLocation');
    const ContactPerson = require('../models/ContactPerson');
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

    // Step 2: Find all branch locations for this client
    const branchLocations = await BranchLocation.find({ client: client._id });
    let totalContactsDeleted = 0;
    let branchLocationIds = branchLocations.map(loc => loc._id);

    // Step 3: Delete all contact persons for these locations
    for (const locId of branchLocationIds) {
      const contacts = await ContactPerson.find({ branchLocation: locId });
      totalContactsDeleted += contacts.length;
      await ContactPerson.deleteMany({ branchLocation: locId });
    }

    // Step 4: Delete all branch locations for this client
    await BranchLocation.deleteMany({ client: client._id });

    // Step 5: Delete the client
    await Client.findByIdAndDelete(req.params.id);

    // TODO: Delete meetings and projects if models/routes exist

    const deletionSummary = {
      clientName: client.clientName,
      deletedItems: {
        branchLocations: branchLocations.length,
        contactPersons: totalContactsDeleted
      }
    };

    console.log('✅ CASCADE DELETION COMPLETED:');
    console.log(`   - Client: "${deletionSummary.clientName}"`);
    console.log(`   - Branch Locations deleted: ${deletionSummary.deletedItems.branchLocations}`);
    console.log(`   - Contact Persons deleted: ${deletionSummary.deletedItems.contactPersons}`);
    console.log('   ✅ ALL RELATED DATA DELETED SUCCESSFULLY');

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