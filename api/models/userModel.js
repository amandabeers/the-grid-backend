const knex = require('../../database/connection.js');

const findByEmail = (email) => knex('users').where({ email }).first();

const findByUsername = (username) => knex('users').where({ username }).first();

const findById = (id) => knex('users').where({ id }).first();

const create = async ({ email, username, password_hash }) => {
  const [id] = await knex('users').insert({ email, username, password_hash });
  return findById(id);
};

// Strip the password hash before returning a user over the API.
const toPublic = (user) => {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
};

module.exports = { findByEmail, findByUsername, findById, create, toPublic };
