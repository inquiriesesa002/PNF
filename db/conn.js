// db.js

const mongoose = require('mongoose');

// Use environment variable first, fallback to current hardcoded string
const DEFAULT_URI = 'mongodb+srv://inquiriesesa_db_user:12345678usamabhai@cluster0.nnuct9e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbURI = (process.env.MONGODB_URI || process.env.DATABASE_URL || DEFAULT_URI).trim();

let isConnected = false;

// Connection options tuned for DNS timeouts and retries
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10s to fail fast
  socketTimeoutMS: 45000,          // 45s I/O timeout
  family: 4,                       // Force IPv4 to avoid IPv6 DNS issues
};

async function connectWithRetry(attempt = 1) {
  const maxAttempts = 5;
  const backoffMs = Math.min(30000, 2000 * attempt); // capped exponential backoff

  try {
    await mongoose.connect(dbURI, connectionOptions);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error(`MongoDB connection error (attempt ${attempt}):`, error);
    isConnected = false;
    if (attempt < maxAttempts) {
      console.log(`Retrying MongoDB connection in ${backoffMs}ms...`);
      setTimeout(() => connectWithRetry(attempt + 1), backoffMs);
    } else {
      console.error('Exceeded maximum MongoDB connection attempts. Will keep retrying in background.');
      setTimeout(() => connectWithRetry(1), 60000); // keep trying every 60s
    }
  }
}

connectWithRetry();

const dbConnection = mongoose.connection;

dbConnection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

dbConnection.on('disconnected', () => {
  isConnected = false;
  console.warn('MongoDB disconnected, attempting reconnect...');
  connectWithRetry();
});

dbConnection.once('open', () => {
  isConnected = true;
  console.log('MongoDB connection open');
});

module.exports = { dbConnection, isConnected: () => isConnected };
