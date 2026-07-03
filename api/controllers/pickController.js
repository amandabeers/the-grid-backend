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

  const { pick_type } = req.body;
  let picked_team_id = null;
  if (pick_type === 'team_win') {
    picked_team_id = req.body.picked_team_id;
    if (![game.home_team_id, game.away_team_id].includes(picked_team_id)) {
      return res
        .status(400)
        .json({ error: 'picked_team_id must be one of the two teams in this game' });
    }
  }

  const pick = await pickModel.upsert({
    user_id: req.user.id,
    game_id: gameId,
    picked_team_id,
    pick_type,
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
    user_id: userId,
    game_id: game.id,
    picked_team_id: Math.random() < 0.5 ? game.home_team_id : game.away_team_id,
    pick_type: 'team_win',
  }));

  const tieIndex = Math.floor(Math.random() * rows.length);
  rows[tieIndex] = { user_id: userId, game_id: rows[tieIndex].game_id, picked_team_id: null, pick_type: 'tie' };

  await pickModel.replaceAllForUserSeason(
    userId,
    games.map((g) => g.id),
    rows,
  );

  const picks = await pickModel.listByUserSeason(userId, req.season.id);
  res.status(200).json({ picks });
};

module.exports = { getMyPicks, setPick, randomize };
