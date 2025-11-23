const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env.test' });

const setupTestDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Test database connected successfully');
    
    // You can add initial test data here if needed
    console.log('Test database setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Test database setup failed:', error);
    process.exit(1);
  }
};

setupTestDatabase();