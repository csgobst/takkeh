const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Vendor = require('../models/Vendor');
const Driver = require('../models/Driver');

const ACCESS_TOKEN_TTL_MIN = 15; // minutes

function generateOtpCode() {
  // 6-digit numeric
  return ('' + Math.floor(100000 + Math.random() * 900000));
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${ACCESS_TOKEN_TTL_MIN}m` });
}

function signRefreshToken(payload, days) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${days}d` });
}

function getModelByType(userType) {
  switch (userType) {
    case 'customer': return Customer;
    case 'vendor': return Vendor;
  case 'driver': return Driver;
    default: throw new Error('Invalid user type');
  }
}

module.exports = {
  generateOtpCode,
  addMinutes,
  signAccessToken,
  signRefreshToken,
  getModelByType,
  ACCESS_TOKEN_TTL_MIN
};
