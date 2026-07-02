const express = require('express');
const authController = require('../controllers/authController.js');
const validate = require('../../middleware/validate.js');
const requireAuth = require('../../middleware/requireAuth.js');
const { registerSchema, loginSchema } = require('../validators/authSchemas.js');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
