const gameModel = require('../models/gameModel.js');
const pickModel = require('../models/pickModel.js');

// GET /api/seasons/:year/picks/me — the requester's picks for the season.
const getMyPicks = async (req, res) => {
  const picks = await pickModel.listByUserSeason(req.user.id, req.season.id);
  res.status(200).json({ picks });
};

// PUT /api/seasons/:year/picks/:gameId — set/update a single pick. Lock is
// enforced by requireUnlocked upstream; body shape by setPickSchema.
const setPick = async (req, res) => {
  const gameId = Number(req.params.gameId);
  const game = await gameModel.findInSeason(req.season.id, gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found in this season' });
  }

  const { pickType } = req.body;
  let pickedTeamId = null;
  if (pickType === 'teamWin') {
    pickedTeamId = req.body.pickedTeamId;
    if (![game.homeTeamId, game.awayTeamId].includes(pickedTeamId)) {
      return res
        .status(400)
        .json({ error: 'pickedTeamId must be one of the two teams in this game' });
    }
  }

  const pick = await pickModel.upsert({
    userId: req.user.id,
    gameId,
    pickedTeamId,
    pickType,
  });
  res.status(200).json({ pick });
};

// POST /api/seasons/:year/picks/randomize — overwrite the whole Grid with random
// winners, then force one random game to a tie so the "≥1 tie" rule holds (SPEC §6.5).
const randomize = async (req, res) => {
  const games = await gameModel.listBySeason(req.season.id);
  if (games.length === 0) {
    return res.status(422).json({ error: 'Season has no games to randomize' });
  }

  const userId = req.user.id;
  const rows = games.map((game) => ({
    userId,
    gameId: game.id,
    pickedTeamId: Math.random() < 0.5 ? game.homeTeamId : game.awayTeamId,
    pickType: 'teamWin',
  }));

  const tieIndex = Math.floor(Math.random() * rows.length);
  rows[tieIndex] = { userId, gameId: rows[tieIndex].gameId, pickedTeamId: null, pickType: 'tie' };

  await pickModel.replaceAllForUserSeason(
    userId,
    games.map((g) => g.id),
    rows,
  );

  const picks = await pickModel.listByUserSeason(userId, req.season.id);
  res.status(200).json({ picks });
};

module.exports = { getMyPicks, setPick, randomize };
