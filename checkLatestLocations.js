const mongoose = require('mongoose');
const LocationTracking = require('./models/LocationTracking');
const User = require('./models/User');

async function checkLatestLocation() {
  try {
    await mongoose.connect('mongodb+srv://pratikkanojiya:Ph9819740701@cluster0.fveoutd.mongodb.net/tikidanSaaS?retryWrites=true&w=majority');
    
    // Get all users
    const users = await User.find().select('name email');
    console.log('\n📋 Checking latest locations for all users:\n');
    
    for (const user of users) {
      const latestLoc = await LocationTracking.findOne({ employee: user._id })
        .sort({ timestamp: -1 })
        .lean();
      
      if (latestLoc) {
        const time = new Date(latestLoc.timestamp).toLocaleString();
        console.log(`👤 ${user.name}:`);
        console.log(`   Latest Event Type: ${latestLoc.eventType || 'undefined (treating as tracking)'}`);
        console.log(`   Time: ${time}`);
        console.log(`   Location: (${latestLoc.latitude.toFixed(4)}, ${latestLoc.longitude.toFixed(4)})`);
        console.log();
      }
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkLatestLocation();
