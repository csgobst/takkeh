const {
  createUser,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout
} = require('../services/userService');

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

exports.signup = asyncHandler(async (req, res) => {
  const { userType, name, email, phone, password } = req.body;
  if (!userType || !name || !email || !phone) {
    return res.status(400).json({ message: 'userType, name, email, phone are required' });
  }
  const result = await createUser({ userType, name, email, phone, password });
  res.status(201).json(result);
});

exports.verify = asyncHandler(async (req, res) => {
  const { userType, userId, channel, code } = req.body;
  if (!userType || !userId || !channel || !code) {
    return res.status(400).json({ message: 'userType, userId, channel, code required' });
  }
  const result = await verifyOtp({ userType, userId, channel, code });
  res.json(result);
});

exports.resend = asyncHandler(async (req, res) => {
  const { userType, userId, channel } = req.body;
  if (!userType || !userId || !channel) {
    return res.status(400).json({ message: 'userType, userId, channel required' });
  }
  const result = await resendOtp({ userType, userId, channel });
  res.json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const { userType, email, phone, password } = req.body;
  if (!userType || (!email && !phone)) {
    return res.status(400).json({ message: 'userType and email or phone required' });
  }
  const result = await login({ userType, email, phone, password });
  res.json(result);
});

exports.refresh = asyncHandler(async (req, res) => {
  const { userType, refreshToken } = req.body;
  if (!userType) return res.status(400).json({ message: 'userType required' });
  if (!req.user || !req.user.uid) return res.status(401).json({ message: 'Unauthorized' });
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
  const result = await refresh({ userType, userId: req.user.uid, token: refreshToken });
  res.json(result);
});

exports.logout = asyncHandler(async (req, res) => {
  const { userType, refreshToken } = req.body;
  if (!userType) return res.status(400).json({ message: 'userType required' });
  if (!req.user || !req.user.uid) return res.status(401).json({ message: 'Unauthorized' });
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
  const result = await logout({ userType, userId: req.user.uid, token: refreshToken });
  res.json(result);
});
