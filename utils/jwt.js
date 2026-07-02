const jwt = require('jsonwebtoken');

const AUTH_COOKIE = 'token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Cookie max-age (ms) kept in sync with the token's 7-day default lifetime.
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
};

const signAuthToken = ({ id, role }) =>
  jwt.sign({ id, role }, getSecret(), { expiresIn: JWT_EXPIRES_IN });

const verifyAuthToken = (token) => jwt.verify(token, getSecret());

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: COOKIE_MAX_AGE,
};

module.exports = { AUTH_COOKIE, signAuthToken, verifyAuthToken, cookieOptions };
