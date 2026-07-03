const knex = require('../../database/connection.js');

// A user's picks for a season, reached via games.season_id (picks has no season_id).
const listByUserSeason = (userId, seasonId) =>
  knex('picks')
    .join('games', 'games.id', 'picks.game_id')
    .where({ 'picks.user_id': userId, 'games.season_id': seasonId })
    .select('picks.*');

const findByUserGame = (userId, gameId) =>
  knex('picks').where({ user_id: userId, game_id: gameId }).first();

// Insert or update the single pick for (user, game); returns the resulting row.
const upsert = async ({ user_id, game_id, picked_team_id, pick_type }) => {
  await knex('picks')
    .insert({ user_id, game_id, picked_team_id, pick_type })
    .onConflict(['user_id', 'game_id'])
    .merge({ picked_team_id, pick_type, updated_at: knex.fn.now() });
  return findByUserGame(user_id, game_id);
};

// Overwrite a user's picks for the given games (used by randomize): delete then
// batch-insert, atomically.
const replaceAllForUserSeason = async (userId, gameIds, rows) =>
  knex.transaction(async (trx) => {
    await trx('picks').where('user_id', userId).whereIn('game_id', gameIds).del();
    if (rows.length) await trx.batchInsert('picks', rows, 100);
  });

module.exports = { listByUserSeason, findByUserGame, upsert, replaceAllForUserSeason };
