require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DBNAME });
    console.log('Connected to MongoDB');

    const adminUsers = await User.find({ isAdmin: true });
    console.log(`Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user._id})`);
    });

    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating default admin user...');

      const adminUser = new User({
        name: 'Admin',
        email: 'admin@aramco.com',
        password: 'admin123', // This will be hashed by the pre-save hook
        isAdmin: true
      });

      await adminUser.save();
      console.log('Default admin user created:');
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: admin123`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
