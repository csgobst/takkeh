const dotenv = require('dotenv');
const path = require('path');

// Load .env once
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'REFRESH_TOKEN_DAYS'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.warn('Warning: Missing env vars:', missing.join(', '));
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenDays: parseInt(process.env.REFRESH_TOKEN_DAYS, 10) || 30,
  nodeEnv: process.env.NODE_ENV || 'development'
};
