const mongoose = require('mongoose');

let isConnected = false;
let mongodInstance = null;

// Disable Mongoose command buffering so queries fail immediately or wait gracefully
// rather than hanging for 10000ms if the connection is down.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  const configuredUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/nss_recruitment';
  const targetUri = configuredUri || defaultLocalUri;

  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 3000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return true;
  } catch (error) {
    // If user provided a specific URI in .env, log error
    if (configuredUri) {
      console.warn(`\n[MongoDB Connection Notice]: Could not connect to configured URI (${error.message})`);
    } else {
      console.warn(`\n[MongoDB Notice]: Local MongoDB service not detected on 127.0.0.1:27017.`);
    }

    // In non-production, fall back to embedded in-memory MongoDB
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting embedded In-Memory MongoDB Server for local development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memoryUri = mongodInstance.getUri();

        const conn = await mongoose.connect(memoryUri);
        isConnected = true;
        console.log(`[MongoDB] Embedded In-Memory MongoDB running at: ${memoryUri}`);

        // Seed initial data if database is empty
        try {
          const Admin = require('../models/Admin');
          const adminCount = await Admin.countDocuments();
          if (adminCount === 0) {
            console.log('[MongoDB] Initializing database with default admin and questions...');
            const seedData = require('../scripts/seed');
            await seedData(false);
          }
        } catch (seedErr) {
          console.warn(`[MongoDB Seed Warning]: ${seedErr.message}`);
        }

        return true;
      } catch (memErr) {
        console.error(`[MongoDB Error] Failed to start in-memory MongoDB: ${memErr.message}`);
      }
    }

    isConnected = false;
    console.warn('Hint: Provide your MongoDB Atlas URI in server/.env (MONGODB_URI=mongodb+srv://<user>:<password>@cluster...).\n');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

const getDBStatus = () => isConnected;

// Graceful cleanup on shutdown
const shutdown = async () => {
  if (mongodInstance) {
    await mongoose.connection.close();
    await mongodInstance.stop();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = connectDB;
module.exports.getDBStatus = getDBStatus;
