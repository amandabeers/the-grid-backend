const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController.js');
const validate = require('../../middleware/validate.js');
const requireAuth = require('../../middleware/requireAuth.js');
const { registerSchema, loginSchema } = require('../validators/authSchemas.js');

const router = express.Router();

// Throttle the public, brute-forceable auth endpoints: 10 requests / 15 min per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
