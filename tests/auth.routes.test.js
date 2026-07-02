const request = require('supertest');

// Stub the knex singleton so importing app.js never touches a real DB/knexfile.
jest.mock('../database/connection', () => ({}));

// Mock the DB layer so no real database (or better-sqlite3 native) is loaded.
jest.mock('../api/models/userModel', () => ({
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  // Real strip implementation — the controller relies on this behavior.
  toPublic: (user) => {
    if (!user) return null;
    const { password_hash, ...rest } = user;
    return rest;
  },
}));

// Mock bcrypt wrappers so tests are fast and deterministic.
jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(async () => 'hashed-pw'),
  verifyPassword: jest.fn(),
}));

const app = require('../app.js');
const userModel = require('../api/models/userModel');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAuthToken, AUTH_COOKIE } = require('../utils/jwt');

const sampleUser = {
  id: 1,
  email: 'a@b.com',
  username: 'amanda',
  password_hash: 'hashed-pw',
  role: 'member',
  created_at: '2026-07-01 00:00:00',
};

// Build a valid auth cookie using the real signing util.
const authCookie = (user = sampleUser) =>
  `${AUTH_COOKIE}=${signAuthToken({ id: user.id, role: user.role })}`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  const validBody = { email: 'a@b.com', username: 'amanda', password: 'password123' };

  it('creates the user, sets an auth cookie, and returns the public user', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.findByUsername.mockResolvedValue(undefined);
    userModel.create.mockResolvedValue(sampleUser);

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie'][0]).toMatch(new RegExp(`^${AUTH_COOKIE}=`));
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(res.body.user).toMatchObject({ id: 1, email: 'a@b.com', role: 'member' });
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(userModel.create).toHaveBeenCalledWith({
      email: 'a@b.com',
      username: 'amanda',
      password_hash: 'hashed-pw',
    });
  });

  it('returns 409 when the email is already in use', async () => {
    userModel.findByEmail.mockResolvedValue(sampleUser);

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('returns 409 when the username is already taken', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);
    userModel.findByUsername.mockResolvedValue(sampleUser);

    const res = await request(app).post('/api/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(userModel.create).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid body and never hashes', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', username: 'x', password: 'short' });

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.details)).toBe(true);
    expect(res.body.details.length).toBeGreaterThanOrEqual(3);
    expect(hashPassword).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/login', () => {
  const validBody = { email: 'a@b.com', password: 'password123' };

  it('sets a cookie and returns the public user on valid credentials', async () => {
    userModel.findByEmail.mockResolvedValue(sampleUser);
    verifyPassword.mockResolvedValue(true);

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(new RegExp(`^${AUTH_COOKIE}=`));
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(verifyPassword).toHaveBeenCalledWith('password123', 'hashed-pw');
  });

  it('returns 401 on a wrong password', async () => {
    userModel.findByEmail.mockResolvedValue(sampleUser);
    verifyPassword.mockResolvedValue(false);

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('returns 401 for an unknown email without checking the password', async () => {
    userModel.findByEmail.mockResolvedValue(undefined);

    const res = await request(app).post('/api/auth/login').send(validBody);

    expect(res.status).toBe(401);
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it('returns 400 on an invalid body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie with a valid session', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie());

    expect(res.status).toBe(204);
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(new RegExp(`^${AUTH_COOKIE}=;`));
    expect(cookie).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('returns 401 without a cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid session', async () => {
    userModel.findById.mockResolvedValue(sampleUser);

    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 1, username: 'amanda' });
    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(userModel.findById).toHaveBeenCalledWith(1);
  });

  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${AUTH_COOKIE}=not-a-real-token`);

    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is valid but the user no longer exists', async () => {
    userModel.findById.mockResolvedValue(undefined);

    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie());

    expect(res.status).toBe(401);
  });
});
