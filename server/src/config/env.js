require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Validate JWT_SECRET on server bootstrap - reject missing or insecure secrets
if (!JWT_SECRET || JWT_SECRET.trim() === '') {
  console.error('\n❌ FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
  console.error('StockFlow requires a secure JWT_SECRET to start. Please configure JWT_SECRET in your .env file.\n');
  process.exit(1);
}

if (NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  console.error('\n❌ FATAL CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters in production.');
  console.error('Please configure a strong, cryptographically secure JWT_SECRET.\n');
  process.exit(1);
}

module.exports = {
  NODE_ENV,
  PORT,
  CLIENT_URL,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
