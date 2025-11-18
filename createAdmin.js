const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

async function createAdmin() {
  try {
    // Use the MongoDB URI directly
    const mongoUri = 'mongodb+srv://pratikkanojiya:Ph9819740701@cluster0.fveoutd.mongodb.net/tikidanSaaS?retryWrites=true&w=majority';
    
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Delete existing admin if exists
    await User.deleteOne({ email: 'admin@tikidan.com' });
    console.log('🗑️ Deleted existing admin user (if any)');
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@tikidan.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@tikidan.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    
    // Verify the user
    const foundUser = await User.findOne({ email: 'admin@tikidan.com' });
    console.log('✅ User verification:', {
      email: foundUser.email,
      role: foundUser.role,
      name: foundUser.name
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

createAdmin();