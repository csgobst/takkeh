const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  confirmedAccount: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  refreshTokens: [{ token: String, createdAt: Date, expiresAt: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
