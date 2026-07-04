const knex = require('../../database/connection.js');

const findByYear = (year) => knex('seasons').where({ year }).first();

module.exports = { findByYear };
