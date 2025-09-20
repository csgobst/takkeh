const mongoose = require('mongoose');

// Store OTP per target (email or phone) and userType + userId
// We keep attempt and resend counters plus expiry tracking.
const otpSchema = new mongoose.Schema({
  userType: { type: String, enum: ['customer', 'vendor', 'driver'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  email: { type: String, lowercase: true, index: true }, // optional: set when channel=email
  phone: { type: String, index: true }, // optional: set when channel=phone
  channel: { type: String, enum: ['email', 'phone'], required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attemptCount: { type: Number, default: 0 }, // attempts to verify
  resendCount: { type: Number, default: 0 },
  locked: { type: Boolean, default: false }
}, { timestamps: true });

otpSchema.index({ userType: 1, userId: 1, channel: 1 }, { unique: true });
otpSchema.index({ userType: 1, email: 1, channel: 1 });
otpSchema.index({ userType: 1, phone: 1, channel: 1 });

module.exports = mongoose.model('Otp', otpSchema);
