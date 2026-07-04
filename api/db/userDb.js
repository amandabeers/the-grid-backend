const knex = require('../../database/connection.js');

const findByEmail = (email) => knex('users').where({ email }).first();

const findByUsername = (username) => knex('users').where({ username }).first();

const findById = (id) => knex('users').where({ id }).first();

const create = async ({ email, username, passwordHash }) => {
  const [id] = await knex('users').insert({ email, username, passwordHash });
  return findById(id);
};

// Strip the password hash before returning a user over the API.
const toPublic = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

module.exports = { findByEmail, findByUsername, findById, create, toPublic };
