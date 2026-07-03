const request = require('supertest');

// Stub the knex singleton so importing app.js never touches a real DB/knexfile.
jest.mock('../database/connection', () => ({}));

// Mock the data layer so no real database (or better-sqlite3 native) is loaded.
jest.mock('../api/models/teamModel', () => ({ listAll: jest.fn() }));

const app = require('../app.js');
const teamModel = require('../api/models/teamModel');
const { signAuthToken, AUTH_COOKIE } = require('../utils/jwt');

const authCookie = (user = { id: 1, role: 'member' }) =>
  `${AUTH_COOKIE}=${signAuthToken({ id: user.id, role: user.role })}`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/teams', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(401);
    expect(teamModel.listAll).not.toHaveBeenCalled();
  });

  it('returns the team list when authed', async () => {
    const teams = [
      { id: 1, name: 'Patriots', conference_abbreviation: 'AFC' },
      { id: 2, name: 'Cowboys', conference_abbreviation: 'NFC' },
    ];
    teamModel.listAll.mockResolvedValue(teams);

    const res = await request(app).get('/api/teams').set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.teams).toHaveLength(2);
    expect(teamModel.listAll).toHaveBeenCalled();
  });
});
