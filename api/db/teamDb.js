const knex = require('../../database/connection.js');

// All NFL teams, joined to their division and conference for grouping/display.
const listAll = () =>
  knex('teams')
    .leftJoin('divisions', 'divisions.id', 'teams.divisionId')
    .leftJoin('conferences', 'conferences.id', 'divisions.conferenceId')
    .orderBy(['conferences.abbreviation', 'divisions.name', 'teams.location'])
    .select(
      'teams.*',
      'divisions.name as divisionName',
      'divisions.abbreviation as divisionAbbreviation',
      'conferences.name as conferenceName',
      'conferences.abbreviation as conferenceAbbreviation',
    );

module.exports = { listAll };
