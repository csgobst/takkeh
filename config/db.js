const mongoose = require('mongoose');
const { mongoUri, nodeEnv } = require('./env');

mongoose.set('strictQuery', true);

let isConnected = false;

async function connectDB() {
  if (isConnected) return mongoose.connection;
  if (!mongoUri) throw new Error('MONGODB_URI not provided');

  try {
    await mongoose.connect(mongoUri, {
      dbName: 'takkeh',
      autoIndex: nodeEnv !== 'production'
    });
    isConnected = true;
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = { connectDB };
