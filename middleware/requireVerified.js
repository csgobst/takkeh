module.exports = function requireVerified(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!req.user.fullyVerified) {
    return res.status(403).json({ message: 'Account not fully verified. Please verify email and phone.' });
  }
  next();
};
