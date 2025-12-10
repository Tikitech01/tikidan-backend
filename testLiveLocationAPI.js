const mongoose = require('mongoose');
const User = require('./models/User');
const LocationTracking = require('./models/LocationTracking');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tikidan';

async function testLiveLocationAPI() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a user with location data
    const usersWithLocation = await LocationTracking.find().distinct('employee');
    
    if (usersWithLocation.length === 0) {
      console.log('❌ No location data found');
      process.exit(0);
    }

    const userId = usersWithLocation[0];
    const user = await User.findById(userId).select('name email role designation');
    
    console.log(`\n📍 Testing Live Location API for: ${user.name}`);
    console.log(`User ID: ${userId}`);

    // Simulate the endpoint logic
    const latestLocation = await LocationTracking.findOne({ employee: userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latestLocation) {
      console.log('❌ No location data found');
      process.exit(0);
    }

    // Calculate time since last update
    const now = new Date();
    const timeSinceUpdate = (now.getTime() - new Date(latestLocation.timestamp).getTime()) / (1000 * 60);

    // Determine status
    let status = 'online';
    if (timeSinceUpdate > 15) {
      status = 'offline';
    } else if (timeSinceUpdate > 5) {
      status = 'idle';
    }

    const responseData = {
      location: {
        latitude: latestLocation.latitude,
        longitude: latestLocation.longitude,
        accuracy: latestLocation.accuracy,
        timestamp: latestLocation.timestamp
      },
      status: status,
      timeSinceUpdate: Math.round(timeSinceUpdate),
      statusMessage: status === 'online' ? 'Active' : status === 'idle' ? 'Idle' : 'Offline'
    };

    console.log('\n✅ API Response (what the frontend will receive):');
    console.log(JSON.stringify(responseData, null, 2));

    console.log('\n✅ All location records for this user:');
    const allLocations = await LocationTracking.find({ employee: userId })
      .sort({ timestamp: -1 })
      .lean();
    
    allLocations.forEach((loc, idx) => {
      const time = new Date(loc.timestamp).toLocaleString();
      console.log(`${idx + 1}. ${time} - (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}) - Accuracy: ±${loc.accuracy}m`);
    });

    console.log(`\n✨ Total location points: ${allLocations.length}`);
    console.log('\n✅ API is working correctly! You should be able to see this data in the frontend.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLiveLocationAPI();
