const userModel = require('../models/userModel.js');
const { hashPassword, verifyPassword } = require('../../utils/password.js');
const { AUTH_COOKIE, signAuthToken, cookieOptions } = require('../../utils/jwt.js');

// Detect a SQLite UNIQUE constraint violation from the insert.
const isUniqueViolation = (err) =>
  err && (err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    /UNIQUE constraint failed/i.test(err.message || ''));

// Issue the auth cookie for a user row.
const setAuthCookie = (res, user) => {
  const token = signAuthToken({ id: user.id, role: user.role });
  res.cookie(AUTH_COOKIE, token, cookieOptions);
};

// POST /api/auth/register — create account (role member), auto-login.
const register = async (req, res) => {
  const { email, username, password } = req.body;

  if (await userModel.findByEmail(email)) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  if (await userModel.findByUsername(username)) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await userModel.create({ email, username, passwordHash });
  } catch (err) {
    // The pre-checks above cover the common case; the unique constraint is the
    // authoritative guard against a race between check and insert.
    if (isUniqueViolation(err)) {
      const field = /username/i.test(err.message) ? 'Username' : 'Email';
      const message = field === 'Username' ? 'Username already taken' : 'Email already in use';
      return res.status(409).json({ error: message });
    }
    throw err;
  }

  setAuthCookie(res, user);
  res.status(201).json({ user: userModel.toPublic(user) });
};

// POST /api/auth/login — verify credentials, set auth cookie.
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);

  // Generic message either way: no user-enumeration hint.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  setAuthCookie(res, user);
  res.status(200).json({ user: userModel.toPublic(user) });
};

// POST /api/auth/logout — clear the auth cookie.
const logout = (req, res) => {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).end();
};

// GET /api/auth/me — current user from the verified JWT.
const me = async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  res.status(200).json({ user: userModel.toPublic(user) });
};

module.exports = { register, login, logout, me };
