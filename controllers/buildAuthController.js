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
      if (!email || !code) return res.status(400).json({ message: 'email, code required' });
      const result = await verifyOtp({ userType, email, channel: 'email', code });
      res.json(result);
    }),

    verifyPhone: asyncHandler(async (req, res) => {
      const { phone, code } = req.body;
      if (!phone || !code) return res.status(400).json({ message: 'phone, code required' });
      const result = await verifyOtp({ userType, phone, channel: 'phone', code });
      res.json(result);
    }),

    resendEmail: asyncHandler(async (req, res) => {
      const { userId, email } = req.body;
      if (!userId && !email) return res.status(400).json({ message: 'userId or email required' });
      const result = await resendOtp({ userType, userId, email, channel: 'email' });
      res.json(result);
    }),

    resendPhone: asyncHandler(async (req, res) => {
      const { userId, phone } = req.body;
      if (!userId && !phone) return res.status(400).json({ message: 'userId or phone required' });
      const result = await resendOtp({ userType, userId, phone, channel: 'phone' });
      res.json(result);
    }),

    login: asyncHandler(async (req, res) => {
      const { email, phone, password } = req.body;
      if ((!email && !phone) || !password) return res.status(400).json({ message: 'email or phone and password required' });
      const result = await login({ userType, email, phone, password });
      res.json(result);
    }),

    refresh: asyncHandler(async (req, res) => {
      const { userId, refreshToken } = req.body;
      if (!userId || !refreshToken) return res.status(400).json({ message: 'userId, refreshToken required' });
      const result = await refresh({ userType, userId, token: refreshToken });
      res.json(result);
    }),

    logout: asyncHandler(async (req, res) => {
      const { userId, refreshToken } = req.body;
      if (!userId || !refreshToken) return res.status(400).json({ message: 'userId, refreshToken required' });
      const result = await logout({ userType, userId, token: refreshToken });
      res.json(result);
    })
  };
};
