const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const { User } = require('./src/models/userModel');

const testUsers = [
  {
    username: 'admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'ADMIN',
    phone: 1234567890,
    gender: 'Male'
  },
  {
    username: 'receptionist',
    email: 'receptionist@hospital.com',
    password: 'recep123',
    role: 'V_SQ_RECEPTIONIST',
    phone: 1234567891,
    gender: 'Female'
  },
  {
    username: 'chiefdoctor',
    email: 'chiefdoctor@hospital.com',
    password: 'doctor123',
    role: 'CHIEF_DOCTOR',
    phone: 1234567892,
    gender: 'Male'
  },
  {
    username: 'labadmin',
    email: 'labadmin@hospital.com',
    password: 'lab123',
    role: 'LAB_ADMIN',
    phone: 1234567893,
    gender: 'Female'
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING);
    console.log('✅ Connected to MongoDB');

    // Delete existing test users
    await User.deleteMany({ 
      email: { $in: testUsers.map(u => u.email) } 
    });
    console.log('🗑️  Cleared existing test users');

    // Create new test users
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('═'.repeat(50));
    testUsers.forEach(user => {
      console.log(`\n${user.role}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
    });
    console.log('\n' + '═'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
