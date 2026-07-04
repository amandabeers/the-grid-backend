const gameDb = require('../db/gameDb.js');

// GET /api/seasons/:year/games — all games for the season, kickoff order.
const listGames = async (req, res) => {
  const games = await gameDb.listBySeason(req.season.id);
  res.status(200).json({ games });
};

module.exports = { listGames };
