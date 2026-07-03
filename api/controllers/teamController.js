const teamModel = require('../models/teamModel.js');

// GET /api/teams — all NFL teams with division/conference context.
const listTeams = async (req, res) => {
  const teams = await teamModel.listAll();
  res.status(200).json({ teams });
};

module.exports = { listTeams };
