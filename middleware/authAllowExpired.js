const jwt = require('jsonwebtoken');

// Middleware similar to authMiddleware but permits expired access tokens so that
// the refresh endpoint can still read user identity (uid, userType) when the
// access token is expired. It still rejects other errors (bad signature, etc.).
module.exports = function authAllowExpired(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    // Manually check expiration to mark flag (exp is in seconds)
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      req.tokenExpired = true;
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
