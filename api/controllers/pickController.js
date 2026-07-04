const gameDb = require('../db/gameDb.js');
const pickDb = require('../db/pickDb.js');
const pickService = require('../services/pick.js');
const grid = require('../services/grid.js');

// GET /api/seasons/:year/picks/me — the requester's picks for the season.
const getMyPicks = async (req, res) => {
  const picks = await pickDb.listByUserSeason(req.user.id, req.season.id);
  res.status(200).json({ picks });
};

// PUT /api/seasons/:year/picks/:gameId — set/update a single pick. Lock is
// enforced by requireUnlocked upstream; body shape by setPickSchema.
const setPick = async (req, res) => {
  const gameId = Number(req.params.gameId);
  const game = await gameDb.findInSeason(req.season.id, gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found in this season' });
  }

  const result = pickService.validatePick(game, req.body);
  if (!result.ok) {
    return res.status(400).json({ error: result.error });
  }

  const pick = await pickDb.upsert({
    userId: req.user.id,
    gameId,
    pickedTeamId: result.pickedTeamId,
    pickType: req.body.pickType,
  });
  res.status(200).json({ pick });
};

// POST /api/seasons/:year/picks/randomize — overwrite the whole Grid with random
// winners, then force one random game to a tie so the "≥1 tie" rule holds (SPEC §6.5).
const randomize = async (req, res) => {
  const games = await gameDb.listBySeason(req.season.id);
  if (games.length === 0) {
    return res.status(422).json({ error: 'Season has no games to randomize' });
  }

  const userId = req.user.id;
  const rows = grid.randomPickRows(games, userId);

  await pickDb.replaceAllForUserSeason(
    userId,
    games.map((g) => g.id),
    rows,
  );

  const picks = await pickDb.listByUserSeason(userId, req.season.id);
  res.status(200).json({ picks });
};

module.exports = { getMyPicks, setPick, randomize };
