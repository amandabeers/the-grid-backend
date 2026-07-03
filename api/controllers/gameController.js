const gameModel = require('../models/gameModel.js');

// GET /api/seasons/:year/games — all games for the season, kickoff order.
const listGames = async (req, res) => {
  const games = await gameModel.listBySeason(req.season.id);
  res.status(200).json({ games });
};

module.exports = { listGames };
