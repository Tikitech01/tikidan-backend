const mongoose = require('mongoose');
const User = require('./models/User');
const LocationTracking = require('./models/LocationTracking');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tikidan';

async function setupTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    // List all users
    const allUsers = await User.find().select('_id name email role');
    console.log('\n📋 Existing users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    // Create an employee if none exists
    let employeeId;
    const existingEmployee = await User.findOne({ role: 'sales_manager' });
    
    if (existingEmployee) {
      employeeId = existingEmployee._id;
      console.log(`\n✅ Using existing sales_manager: ${existingEmployee.name}`);
    } else {
      const hashedPassword = await bcrypt.hash('sales123', 10);
      const newEmployee = new User({
        name: 'John Field Sales',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'sales_manager',
        designation: 'Sales Executive'
      });
      await newEmployee.save();
      employeeId = newEmployee._id;
      console.log(`\n✅ Created new sales_manager: John Field Sales (john@example.com)`);
    }

    console.log(`Using employee ID: ${employeeId}`);

    // Create location tracking data
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Sample coordinates (New York area for demo)
    const baseCoordinates = [
      { lat: 40.7128, lon: -74.0060, name: 'Manhattan' },
      { lat: 40.7282, lon: -73.9949, name: 'Queens' },
      { lat: 40.6501, lon: -73.9496, name: 'Brooklyn' },
      { lat: 40.7614, lon: -73.9776, name: 'Central Park' },
      { lat: 40.7489, lon: -73.9680, name: 'Times Square' }
    ];

    // Clear existing location data
    const deleteResult = await LocationTracking.deleteMany({ employee: employeeId });
    console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} existing location records`);

    // Generate location points
    const locationPoints = [];
    const startTime = new Date(today);
    startTime.setHours(9, 0, 0, 0); // Start at 9 AM

    for (let i = 0; i < baseCoordinates.length; i++) {
      const coord = baseCoordinates[i];
      const timestamp = new Date(startTime.getTime() + i * 5 * 60 * 1000); // Every 5 minutes
      
      const variation = 0.001;
      const lat = coord.lat + (Math.random() - 0.5) * variation;
      const lon = coord.lon + (Math.random() - 0.5) * variation;

      locationPoints.push({
        employee: employeeId,
        latitude: lat,
        longitude: lon,
        accuracy: Math.floor(Math.random() * 10) + 5,
        timestamp: timestamp,
        date: today
      });
    }

    // Add recent location (within last 5 minutes for "online" status)
    const recentTime = new Date();
    recentTime.setMinutes(recentTime.getMinutes() - 2);
    const recentCoord = baseCoordinates[baseCoordinates.length - 1];
    
    locationPoints.push({
      employee: employeeId,
      latitude: recentCoord.lat + (Math.random() - 0.5) * 0.001,
      longitude: recentCoord.lon + (Math.random() - 0.5) * 0.001,
      accuracy: Math.floor(Math.random() * 10) + 5,
      timestamp: recentTime,
      date: new Date()
    });

    // Insert data
    const result = await LocationTracking.insertMany(locationPoints);
    console.log(`\n✅ Successfully added ${result.length} location tracking points`);
    console.log(`📍 Locations: ${baseCoordinates.map(c => c.name).join(', ')}`);
    console.log(`⏰ Latest update: ${recentTime.toLocaleString()}`);
    console.log(`\n✨ Now when you click "Load Live Location" in the employee details, you should see the data!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

setupTestData();
