const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./src/models/userModel');

async function verifyUsers() {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    
    console.log('📋 USERS IN DATABASE:');
    console.log('═'.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.role}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Gender: ${user.gender}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\nTotal Users: ${users.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUsers();
