// Auth / User service implementing signup, OTP, verification, login, refresh, logout.

const bcrypt = require('bcrypt');
const Otp = require('../models/Otp');
const { getModelByType, generateOtpCode, addMinutes, signAccessToken, signRefreshToken, ACCESS_TOKEN_TTL_MIN } = require('../utils/authHelpers');

const OTP_TTL_MIN = 5;
const OTP_MAX_ATTEMPTS = 15;
const OTP_MAX_RESENDS = 10;
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '30', 10);

function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  return user[0] + '***@' + domain;
}

function maskPhone(phone) {
  if (!phone) return '';
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

async function upsertOtp({ userType, userId, channel, email, phone }) {
  const code = generateOtpCode();
  const expiresAt = addMinutes(new Date(), OTP_TTL_MIN);
  const existing = await Otp.findOne({ userType, userId, channel });
  if (existing) {
    // Resend logic requires checking resend count and expiry/time
    if (existing.resendCount >= OTP_MAX_RESENDS && existing.expiresAt > new Date()) {
      throw new Error('Resend limit reached. Wait until code expires.');
    }
    existing.code = code;
    existing.expiresAt = expiresAt;
    existing.attemptCount = 0;
    existing.resendCount = existing.resendCount + 1;
    existing.locked = false;
    if (email) existing.email = email.toLowerCase();
    if (phone) existing.phone = phone;
    await existing.save();
    return existing;
  }
  const created = await Otp.create({ userType, userId, channel, code, expiresAt, email: email ? email.toLowerCase() : undefined, phone });
  return created;
}

async function createUser({ userType, name, email, phone, password }) {
  const Model = getModelByType(userType);
  const existingEmail = await Model.findOne({ email });
  if (existingEmail) throw new Error('Email already registered');
  const existingPhone = await Model.findOne({ phone });
  if (existingPhone) throw new Error('Phone already registered');

  if (!password) throw new Error('Password required');
  const passwordHash = await bcrypt.hash(password, 10);

  const doc = await Model.create({ name, email, phone, passwordHash });

  // Issue OTP for email and phone
  await upsertOtp({ userType, userId: doc._id, channel: 'email', email });
  await upsertOtp({ userType, userId: doc._id, channel: 'phone', phone });

  return {
    user: sanitizeUser(doc, userType),
    message: `OTP sent to email (${maskEmail(email)}) and phone (${maskPhone(phone)}). It will expire in ${OTP_TTL_MIN} minutes.`
  };
}

function sanitizeUser(doc, userType) {
  if (!doc) return null;
  const json = doc.toObject();
  delete json.passwordHash;
  delete json.refreshTokens;
  return { ...json, userType };
}

async function verifyOtp({ userType, email, phone, channel, code }) {
  const Model = getModelByType(userType);
  const lookup = channel === 'email' ? { email } : { phone };
  if (!lookup.email && !lookup.phone) throw new Error('Provide email or phone for verification');
  const user = await Model.findOne(lookup);
  if (!user) throw new Error('User not found');

  // Prefer direct lookup by email/phone for quicker matching
  let recordQuery = { userType, userId: user._id, channel };
  if (channel === 'email' && email) recordQuery = { userType, email: email.toLowerCase(), channel };
  if (channel === 'phone' && phone) recordQuery = { userType, phone, channel };
  const record = await Otp.findOne(recordQuery);
  if (!record) throw new Error('OTP not found, request a new one');
  if (record.expiresAt < new Date()) throw new Error('OTP expired, request a new one');
  if (record.locked) throw new Error('Too many attempts, request a new OTP');

  record.attemptCount += 1;
  if (record.attemptCount > OTP_MAX_ATTEMPTS) {
    record.locked = true;
    await record.save();
    throw new Error('Too many attempts, OTP locked');
  }

  if (record.code !== code) {
    await record.save();
    const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - record.attemptCount);
    throw Object.assign(new Error(`Invalid code. You have ${attemptsLeft} attempts left.`), { status: 400 });
  }

  // Success
  if (channel === 'email') user.emailVerified = true;
  if (channel === 'phone') user.phoneVerified = true;
  await user.save();
  await Otp.deleteOne({ _id: record._id }); // remove used OTP

  return { user: sanitizeUser(user, userType), message: `${channel} verified` };
}

async function resendOtp({ userType, userId, email, phone, channel }) {
  const Model = getModelByType(userType);
  let user = null;
  if (userId) user = await Model.findById(userId);
  if (!user && email) user = await Model.findOne({ email });
  if (!user && phone) user = await Model.findOne({ phone });
  if (!user) throw new Error('User not found');

  const otp = await upsertOtp({ userType, userId: user._id, channel, email: user.email, phone: user.phone });
  return {
    message: `OTP resent for ${channel}. It will expire in ${OTP_TTL_MIN} minutes. You have ${(OTP_MAX_RESENDS - otp.resendCount)} resend(s) left.`
  };
}

async function login({ userType, email, phone, password }) {
  const Model = getModelByType(userType);
  const query = email ? { email } : { phone };
  const user = await Model.findOne(query);
  if (!user) throw new Error('Invalid credentials');

  if (password && user.passwordHash) {
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new Error('Invalid credentials');
  }

  const fullyVerified = !!(user.emailVerified && user.phoneVerified);
  const limitedApproval = (userType === 'vendor' || userType === 'driver') && !user.confirmedAccount;

  const payloadBase = {
    uid: user._id.toString(),
    userType,
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    fullyVerified,
    limited: limitedApproval
  };

  const accessToken = signAccessToken(payloadBase);
  const refreshToken = signRefreshToken(payloadBase, REFRESH_TOKEN_DAYS);
  await storeRefreshToken(user, refreshToken);

  return {
    user: sanitizeUser(user, userType),
    accessToken,
    refreshToken,
    expiresInMinutes: ACCESS_TOKEN_TTL_MIN,
    fullyVerified,
    limited: limitedApproval,
    message: !fullyVerified ? 'Email/Phone not fully verified yet.' : (limitedApproval ? 'Account pending approval by Super Admin.' : 'Login successful')
  };
}

async function storeRefreshToken(user, token) {
  const now = new Date();
  const expiresAt = addMinutes(now, REFRESH_TOKEN_DAYS * 24 * 60);
  user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.expiresAt > now);
  user.refreshTokens.push({ token, createdAt: now, expiresAt });
  await user.save();
}

async function refresh({ userType, userId, token }) {
  const Model = getModelByType(userType);
  const user = await Model.findById(userId);
  if (!user) throw new Error('User not found');
  const stored = (user.refreshTokens || []).find(rt => rt.token === token && rt.expiresAt > new Date());
  if (!stored) throw Object.assign(new Error('Invalid refresh token'), { status: 401 });

  const payload = {
    uid: user._id.toString(),
    userType,
    emailVerified: !!user.emailVerified,
    phoneVerified: !!user.phoneVerified,
    fullyVerified: !!(user.emailVerified && user.phoneVerified),
    limited: (userType === 'vendor' || userType === 'driver') && !user.confirmedAccount
  };
  const accessToken = signAccessToken(payload);
  return { accessToken, expiresInMinutes: ACCESS_TOKEN_TTL_MIN };
}

async function logout({ userType, userId, token }) {
  const Model = getModelByType(userType);
  const user = await Model.findById(userId);
  if (!user) return { message: 'Logged out' };
  user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.token !== token);
  await user.save();
  return { message: 'Logged out' };
}

module.exports = {
  createUser,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout
};
