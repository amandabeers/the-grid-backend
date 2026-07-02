const { AUTH_COOKIE, verifyAuthToken } = require('../utils/jwt.js');

// Reads the JWT from the auth cookie, verifies it, and attaches
// req.user = { id, role }. Responds 401 if missing or invalid.
const requireAuth = (req, res, next) => {
  const token = req.cookies && req.cookies[AUTH_COOKIE];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = verifyAuthToken(token);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

module.exports = requireAuth;
