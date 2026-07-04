const gameDb = require('../db/gameDb.js');
const pickDb = require('../db/pickDb.js');
const grid = require('../services/grid.js');

// POST /api/seasons/:year/grid/submit — validation checkpoint only (SPEC §6.2).
// Completeness is decided by services/grid; this does not persist or lock
// anything — picks stay editable until lockAt.
const submit = async (req, res) => {
  const [games, picks] = await Promise.all([
    gameDb.listBySeason(req.season.id),
    pickDb.listByUserSeason(req.user.id, req.season.id),
  ]);

  const { complete, reasons } = grid.evaluate(games, picks);
  if (!complete) {
    return res.status(422).json({ complete: false, reasons });
  }
  res.status(200).json({ complete: true });
};

module.exports = { submit };
