const knex = require('../../database/connection.js');

// All NFL teams, joined to their division and conference for grouping/display.
const listAll = () =>
  knex('teams')
    .leftJoin('divisions', 'divisions.id', 'teams.division_id')
    .leftJoin('conferences', 'conferences.id', 'divisions.conference_id')
    .orderBy(['conferences.abbreviation', 'divisions.name', 'teams.location'])
    .select(
      'teams.*',
      'divisions.name as division_name',
      'divisions.abbreviation as division_abbreviation',
      'conferences.name as conference_name',
      'conferences.abbreviation as conference_abbreviation',
    );

module.exports = { listAll };
