const mongoose = require('mongoose');
const User = require('./models/User');

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tikidan_saas');
    
    const users = await User.find().select('name email role');
    console.log('📋 Users in database:\n');
    users.forEach(u => {
      console.log(`✓ ${u.name} | ${u.email} | Role: ${u.role}`);
    });
    
    if (users.length === 0) {
      console.log('❌ No users found. Run createAdmin.js first');
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDatabase();
