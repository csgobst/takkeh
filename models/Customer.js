const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // optional until password-based login (if needed)
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  refreshTokens: [{ token: String, createdAt: Date, expiresAt: Date }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
