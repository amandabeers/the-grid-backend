const gameModel = require('../models/gameModel.js');
const pickModel = require('../models/pickModel.js');

// POST /api/seasons/:year/grid/submit — validation checkpoint only (SPEC §6.2).
// A Grid is complete iff every game has a pick and at least one pick is a tie.
// This does not persist or lock anything; picks stay editable until lockAt.
const submit = async (req, res) => {
  const [games, picks] = await Promise.all([
    gameModel.listBySeason(req.season.id),
    pickModel.listByUserSeason(req.user.id, req.season.id),
  ]);

  const reasons = [];
  const pickedGameIds = new Set(picks.map((p) => p.gameId));
  const missing = games.filter((g) => !pickedGameIds.has(g.id)).length;
  if (missing > 0) {
    reasons.push(`${missing} games unpicked`);
  }
  if (!picks.some((p) => p.pickType === 'tie')) {
    reasons.push('no tie pick');
  }

  if (reasons.length) {
    return res.status(422).json({ complete: false, reasons });
  }
  res.status(200).json({ complete: true });
};

module.exports = { submit };
