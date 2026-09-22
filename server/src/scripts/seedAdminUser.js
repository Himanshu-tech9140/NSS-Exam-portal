// Seed script to ensure an admin user exists with the desired credentials
require('dotenv').config();
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const seedAdminUser = async () => {
  try {
    console.log('[SeedAdminUser] Connecting to DB...');
    await connectDB();

    const username = 'admin';
    const rawPassword = 'AdminPassword123';

    // Find existing admin
    let admin = await Admin.findOne({ username });
    if (admin) {
      admin.password = rawPassword; // pre‑save hook will hash
      await admin.save();
      console.log('[SeedAdminUser] Updated admin password.');
    } else {
      admin = await Admin.create({ username, password: rawPassword });
      console.log('[SeedAdminUser] Created admin user.');
    }

    console.log('[SeedAdminUser] Finished. Username:', admin.username);
    process.exit(0);
  } catch (err) {
    console.error('[SeedAdminUser] Error:', err);
    process.exit(1);
  }
};

seedAdminUser();
