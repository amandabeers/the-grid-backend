const knex = require('../../database/connection.js');

// All games for a season, ordered by kickoff, with the week number joined in.
const listBySeason = (seasonId) =>
  knex('games')
    .leftJoin('weeks', 'weeks.id', 'games.weekId')
    .where('games.seasonId', seasonId)
    .orderBy('games.startTimeEt', 'asc')
    .select('games.*', 'weeks.weekNumber');

// A single game, scoped to the season so cross-season ids can't be picked.
const findInSeason = (seasonId, gameId) =>
  knex('games').where({ id: gameId, seasonId }).first();

module.exports = { listBySeason, findInSeason };
