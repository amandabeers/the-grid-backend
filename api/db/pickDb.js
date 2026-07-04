const knex = require('../../database/connection.js');

// A user's picks for a season, reached via games.seasonId (picks has no seasonId).
const listByUserSeason = (userId, seasonId) =>
  knex('picks')
    .join('games', 'games.id', 'picks.gameId')
    .where({ 'picks.userId': userId, 'games.seasonId': seasonId })
    .select('picks.*');

const findByUserGame = (userId, gameId) =>
  knex('picks').where({ userId, gameId }).first();

// Insert or update the single pick for (user, game); returns the resulting row.
const upsert = async ({ userId, gameId, pickedTeamId, pickType }) => {
  await knex('picks')
    .insert({ userId, gameId, pickedTeamId, pickType })
    .onConflict(['userId', 'gameId'])
    .merge({ pickedTeamId, pickType, updatedAt: knex.fn.now() });
  return findByUserGame(userId, gameId);
};

// Overwrite a user's picks for the given games (used by randomize): delete then
// batch-insert, atomically.
const replaceAllForUserSeason = async (userId, gameIds, rows) =>
  knex.transaction(async (trx) => {
    await trx('picks').where('userId', userId).whereIn('gameId', gameIds).del();
    if (rows.length) await trx.batchInsert('picks', rows, 100);
  });

module.exports = { listByUserSeason, findByUserGame, upsert, replaceAllForUserSeason };
