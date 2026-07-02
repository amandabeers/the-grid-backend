const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  // Cap at 72: bcrypt only uses the first 72 bytes of the password.
  password: Joi.string().min(8).max(72).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
