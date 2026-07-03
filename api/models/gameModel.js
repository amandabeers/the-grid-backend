const knex = require('../../database/connection.js');

// All games for a season, ordered by kickoff, with the week number joined in.
const listBySeason = (seasonId) =>
  knex('games')
    .leftJoin('weeks', 'weeks.id', 'games.week_id')
    .where('games.season_id', seasonId)
    .orderBy('games.kickoff_at', 'asc')
    .select('games.*', 'weeks.week_number');

// A single game, scoped to the season so cross-season ids can't be picked.
const findInSeason = (seasonId, gameId) =>
  knex('games').where({ id: gameId, season_id: seasonId }).first();

module.exports = { listBySeason, findInSeason };
