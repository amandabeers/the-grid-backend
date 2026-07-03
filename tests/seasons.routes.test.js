const request = require('supertest');

// Stub the knex singleton so importing app.js never touches a real DB/knexfile.
jest.mock('../database/connection', () => ({}));

// Mock the data layer so no real database (or better-sqlite3 native) is loaded.
jest.mock('../api/models/seasonModel', () => ({ findByYear: jest.fn() }));
jest.mock('../api/models/gameModel', () => ({
  listBySeason: jest.fn(),
  findInSeason: jest.fn(),
}));
jest.mock('../api/models/pickModel', () => ({
  listByUserSeason: jest.fn(),
  upsert: jest.fn(),
  replaceAllForUserSeason: jest.fn(),
}));

const app = require('../app.js');
const seasonModel = require('../api/models/seasonModel');
const gameModel = require('../api/models/gameModel');
const pickModel = require('../api/models/pickModel');
const { signAuthToken, AUTH_COOKIE } = require('../utils/jwt');

const YEAR = 2026;
// lock_at far in the future = picks open; a past value = locked.
const openSeason = { id: 7, year: YEAR, lock_at: '2999-01-01 00:00:00' };
const lockedSeason = { id: 7, year: YEAR, lock_at: '2000-01-01 00:00:00' };

const authCookie = (user = { id: 1, role: 'member' }) =>
  `${AUTH_COOKIE}=${signAuthToken({ id: user.id, role: user.role })}`;

// A game with two distinct team ids so team-membership checks are meaningful.
const game = (id, overrides = {}) => ({
  id,
  season_id: openSeason.id,
  home_team_id: id * 10,
  away_team_id: id * 10 + 1,
  kickoff_at: '2026-09-10 00:00:00',
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  seasonModel.findByYear.mockResolvedValue(openSeason);
});

describe('auth guard', () => {
  it('returns 401 without a cookie', async () => {
    const res = await request(app).get(`/api/seasons/${YEAR}/games`);
    expect(res.status).toBe(401);
    expect(seasonModel.findByYear).not.toHaveBeenCalled();
  });
});

describe('GET /api/seasons/:year/games', () => {
  it('returns the season games', async () => {
    const games = [game(1), game(2)];
    gameModel.listBySeason.mockResolvedValue(games);

    const res = await request(app).get(`/api/seasons/${YEAR}/games`).set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.games).toHaveLength(2);
    expect(gameModel.listBySeason).toHaveBeenCalledWith(openSeason.id);
  });

  it('returns 404 for an unknown season', async () => {
    seasonModel.findByYear.mockResolvedValue(undefined);

    const res = await request(app).get(`/api/seasons/1999/games`).set('Cookie', authCookie());

    expect(res.status).toBe(404);
  });
});

describe('GET /api/seasons/:year/picks/me', () => {
  it('returns the requester picks', async () => {
    pickModel.listByUserSeason.mockResolvedValue([{ id: 5, game_id: 1, pick_type: 'tie' }]);

    const res = await request(app)
      .get(`/api/seasons/${YEAR}/picks/me`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body.picks).toHaveLength(1);
    expect(pickModel.listByUserSeason).toHaveBeenCalledWith(1, openSeason.id);
  });
});

describe('PUT /api/seasons/:year/picks/:gameId', () => {
  it('upserts a team_win pick pre-lock', async () => {
    const g = game(3);
    gameModel.findInSeason.mockResolvedValue(g);
    pickModel.upsert.mockResolvedValue({ id: 9, game_id: g.id, pick_type: 'team_win' });

    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/${g.id}`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'team_win', picked_team_id: g.home_team_id });

    expect(res.status).toBe(200);
    expect(pickModel.upsert).toHaveBeenCalledWith({
      user_id: 1,
      game_id: g.id,
      picked_team_id: g.home_team_id,
      pick_type: 'team_win',
    });
  });

  it('normalizes a tie pick to picked_team_id null', async () => {
    const g = game(4);
    gameModel.findInSeason.mockResolvedValue(g);
    pickModel.upsert.mockResolvedValue({ id: 10 });

    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/${g.id}`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'tie', picked_team_id: g.home_team_id });

    expect(res.status).toBe(200);
    expect(pickModel.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ pick_type: 'tie', picked_team_id: null }),
    );
  });

  it('returns 423 after lock', async () => {
    seasonModel.findByYear.mockResolvedValue(lockedSeason);

    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/3`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'team_win', picked_team_id: 30 });

    expect(res.status).toBe(423);
    expect(gameModel.findInSeason).not.toHaveBeenCalled();
  });

  it('returns 400 for a team not in the game', async () => {
    const g = game(3);
    gameModel.findInSeason.mockResolvedValue(g);

    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/${g.id}`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'team_win', picked_team_id: 99999 });

    expect(res.status).toBe(400);
    expect(pickModel.upsert).not.toHaveBeenCalled();
  });

  it('returns 400 when team_win omits picked_team_id', async () => {
    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/3`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'team_win' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for a game not in the season', async () => {
    gameModel.findInSeason.mockResolvedValue(undefined);

    const res = await request(app)
      .put(`/api/seasons/${YEAR}/picks/12345`)
      .set('Cookie', authCookie())
      .send({ pick_type: 'tie' });

    expect(res.status).toBe(404);
  });
});

describe('POST /api/seasons/:year/picks/randomize', () => {
  it('overwrites all picks with exactly one tie', async () => {
    const games = [game(1), game(2), game(3), game(4)];
    gameModel.listBySeason.mockResolvedValue(games);
    pickModel.replaceAllForUserSeason.mockResolvedValue();
    pickModel.listByUserSeason.mockResolvedValue([]);

    const res = await request(app)
      .post(`/api/seasons/${YEAR}/picks/randomize`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    const [userId, gameIds, rows] = pickModel.replaceAllForUserSeason.mock.calls[0];
    expect(userId).toBe(1);
    expect(gameIds).toEqual(games.map((g) => g.id));
    expect(rows).toHaveLength(games.length);
    expect(rows.filter((r) => r.pick_type === 'tie')).toHaveLength(1);
    rows
      .filter((r) => r.pick_type === 'team_win')
      .forEach((r) => {
        const g = games.find((x) => x.id === r.game_id);
        expect([g.home_team_id, g.away_team_id]).toContain(r.picked_team_id);
      });
  });

  it('returns 422 when the season has no games', async () => {
    gameModel.listBySeason.mockResolvedValue([]);

    const res = await request(app)
      .post(`/api/seasons/${YEAR}/picks/randomize`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(422);
    expect(pickModel.replaceAllForUserSeason).not.toHaveBeenCalled();
  });

  it('returns 423 after lock', async () => {
    seasonModel.findByYear.mockResolvedValue(lockedSeason);

    const res = await request(app)
      .post(`/api/seasons/${YEAR}/picks/randomize`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(423);
    expect(gameModel.listBySeason).not.toHaveBeenCalled();
  });
});

describe('POST /api/seasons/:year/grid/submit', () => {
  it('returns 200 for a complete grid', async () => {
    const games = [game(1), game(2)];
    gameModel.listBySeason.mockResolvedValue(games);
    pickModel.listByUserSeason.mockResolvedValue([
      { game_id: 1, pick_type: 'team_win' },
      { game_id: 2, pick_type: 'tie' },
    ]);

    const res = await request(app)
      .post(`/api/seasons/${YEAR}/grid/submit`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ complete: true });
  });

  it('returns 422 with reasons when picks are missing and no tie', async () => {
    const games = [game(1), game(2), game(3)];
    gameModel.listBySeason.mockResolvedValue(games);
    pickModel.listByUserSeason.mockResolvedValue([{ game_id: 1, pick_type: 'team_win' }]);

    const res = await request(app)
      .post(`/api/seasons/${YEAR}/grid/submit`)
      .set('Cookie', authCookie());

    expect(res.status).toBe(422);
    expect(res.body.complete).toBe(false);
    expect(res.body.reasons).toEqual(expect.arrayContaining(['2 games unpicked', 'no tie pick']));
  });
});
