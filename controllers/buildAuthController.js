const {
  createUser,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout
} = require('../services/userService');

function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }

module.exports = function buildAuthController(userType) {
  return {
    signup: asyncHandler(async (req, res) => {
      const { name, email, phone, password } = req.body;
      if (!name || !email || !phone || !password) return res.status(400).json({ message: 'name, email, phone, password required' });
      const result = await createUser({ userType, name, email, phone, password });
      res.status(201).json(result);
    }),

    verifyEmail: asyncHandler(async (req, res) => {
      const { email, code } = req.body;
      if (!code) return res.status(400).json({ message: 'code required' });
      // If authenticated, prefer authenticated identity.
      const result = await verifyOtp({ userType, email, channel: 'email', code, authUser: req.user });
      res.json(result);
    }),

    verifyPhone: asyncHandler(async (req, res) => {
      const { phone, code } = req.body;
      if (!code) return res.status(400).json({ message: 'code required' });
      const result = await verifyOtp({ userType, phone, channel: 'phone', code, authUser: req.user });
      res.json(result);
    }),

    resendEmail: asyncHandler(async (req, res) => {
      // userId/email optional if authenticated token provided
      const { userId, email } = req.body;
      const effectiveUserId = (req.user && req.user.uid) || userId;
      if (!effectiveUserId && !email) return res.status(400).json({ message: 'userId or email required' });
      const result = await resendOtp({ userType, userId: effectiveUserId, email, channel: 'email' });
      res.json(result);
    }),

    resendPhone: asyncHandler(async (req, res) => {
      const { userId, phone } = req.body;
      const effectiveUserId = (req.user && req.user.uid) || userId;
      if (!effectiveUserId && !phone) return res.status(400).json({ message: 'userId or phone required' });
      const result = await resendOtp({ userType, userId: effectiveUserId, phone, channel: 'phone' });
      res.json(result);
    }),

    login: asyncHandler(async (req, res) => {
      const { email, phone, password } = req.body;
      if ((!email && !phone) || !password) return res.status(400).json({ message: 'email or phone and password required' });
      const result = await login({ userType, email, phone, password });
      res.json(result);
    }),

    refresh: asyncHandler(async (req, res) => {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
      const result = await refresh({ userType, userId: req.user.uid, token: refreshToken });
      res.json(result);
    }),

    logout: asyncHandler(async (req, res) => {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
      const result = await logout({ userType, userId: req.user.uid, token: refreshToken });
      res.json(result);
    })
  };
};
