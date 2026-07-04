const teamDb = require('../db/teamDb.js');

// GET /api/teams — all NFL teams with division/conference context.
const listTeams = async (req, res) => {
  const teams = await teamDb.listAll();
  res.status(200).json({ teams });
};

module.exports = { listTeams };
