const jwt = require('jsonwebtoken');
const ms = require('ms');

const AUTH_COOKIE = 'token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Cookie max-age (ms) derived from the token lifetime so the two stay in sync.
const COOKIE_MAX_AGE = ms(JWT_EXPIRES_IN);

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
  // Secure (HTTPS-only) is opt-out via COOKIE_SECURE, else on by default in production.
  secure: process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  maxAge: COOKIE_MAX_AGE,
};

module.exports = { AUTH_COOKIE, signAuthToken, verifyAuthToken, cookieOptions };
