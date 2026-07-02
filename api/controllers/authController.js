const userModel = require('../models/userModel.js');
const { hashPassword, verifyPassword } = require('../../utils/password.js');
const { AUTH_COOKIE, signAuthToken, cookieOptions } = require('../../utils/jwt.js');

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

  const password_hash = await hashPassword(password);
  const user = await userModel.create({ email, username, password_hash });

  setAuthCookie(res, user);
  res.status(201).json({ user: userModel.toPublic(user) });
};

// POST /api/auth/login — verify credentials, set auth cookie.
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findByEmail(email);

  // Generic message either way: no user-enumeration hint.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
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
