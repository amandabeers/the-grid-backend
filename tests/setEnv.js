// Runs before modules are loaded so the real utils/jwt has a secret to use.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
