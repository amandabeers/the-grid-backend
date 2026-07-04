/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Delete in FK-safe order (children before parents).
  await knex('picks').del();
  await knex('games').del();
  await knex('weeks').del();
  await knex('users').del();
  await knex('seasons').del();
  await knex('teams').del();
  await knex('divisions').del();
  await knex('conferences').del();

  const conferences = [
    { name: 'American Football Conference', abbreviation: 'AFC' },
    { name: 'National Football Conference', abbreviation: 'NFC' }
  ];

  const insertedConferences = await knex('conferences')
    .insert(conferences)
    .returning('id');

  const [afcId, nfcId] = insertedConferences.map((row) => row.id);

  const divisions = [
    { name: 'East', conferenceId: afcId },
    { name: 'North', conferenceId: afcId },
    { name: 'South', conferenceId: afcId },
    { name: 'West', conferenceId: afcId },
    { name: 'East', conferenceId: nfcId },
    { name: 'North', conferenceId: nfcId },
    { name: 'South', conferenceId: nfcId },
    { name: 'West', conferenceId: nfcId }
  ];

  const insertedDivisions = await knex('divisions')
    .insert(divisions)
    .returning(['id', 'name', 'conferenceId']);

  const divisionMap = insertedDivisions.reduce((map, division) => {
    const key = `${division.conferenceId}-${division.name}`;
    map[key] = division.id;
    return map;
  }, {});

  const teams = [
    { name: 'Bills', location: 'Buffalo', abbreviation: 'BUF', divisionId: divisionMap[`${afcId}-East`] },
    { name: 'Dolphins', location: 'Miami', abbreviation: 'MIA', divisionId: divisionMap[`${afcId}-East`] },
    { name: 'Patriots', location: 'New England', abbreviation: 'NE', divisionId: divisionMap[`${afcId}-East`] },
    { name: 'Jets', location: 'New York', abbreviation: 'NYJ', divisionId: divisionMap[`${afcId}-East`] },
    { name: 'Ravens', location: 'Baltimore', abbreviation: 'BAL', divisionId: divisionMap[`${afcId}-North`] },
    { name: 'Bengals', location: 'Cincinnati', abbreviation: 'CIN', divisionId: divisionMap[`${afcId}-North`] },
    { name: 'Browns', location: 'Cleveland', abbreviation: 'CLE', divisionId: divisionMap[`${afcId}-North`] },
    { name: 'Steelers', location: 'Pittsburgh', abbreviation: 'PIT', divisionId: divisionMap[`${afcId}-North`] },
    { name: 'Texans', location: 'Houston', abbreviation: 'HOU', divisionId: divisionMap[`${afcId}-South`] },
    { name: 'Colts', location: 'Indianapolis', abbreviation: 'IND', divisionId: divisionMap[`${afcId}-South`] },
    { name: 'Jaguars', location: 'Jacksonville', abbreviation: 'JAX', divisionId: divisionMap[`${afcId}-South`] },
    { name: 'Titans', location: 'Tennessee', abbreviation: 'TEN', divisionId: divisionMap[`${afcId}-South`] },
    { name: 'Broncos', location: 'Denver', abbreviation: 'DEN', divisionId: divisionMap[`${afcId}-West`] },
    { name: 'Chiefs', location: 'Kansas City', abbreviation: 'KC', divisionId: divisionMap[`${afcId}-West`] },
    { name: 'Raiders', location: 'Las Vegas', abbreviation: 'LV', divisionId: divisionMap[`${afcId}-West`] },
    { name: 'Chargers', location: 'Los Angeles', abbreviation: 'LAC', divisionId: divisionMap[`${afcId}-West`] },
    { name: 'Cowboys', location: 'Dallas', abbreviation: 'DAL', divisionId: divisionMap[`${nfcId}-East`] },
    { name: 'Giants', location: 'New York', abbreviation: 'NYG', divisionId: divisionMap[`${nfcId}-East`] },
    { name: 'Eagles', location: 'Philadelphia', abbreviation: 'PHI', divisionId: divisionMap[`${nfcId}-East`] },
    { name: 'Commanders', location: 'Washington', abbreviation: 'WSH', divisionId: divisionMap[`${nfcId}-East`] },
    { name: 'Bears', location: 'Chicago', abbreviation: 'CHI', divisionId: divisionMap[`${nfcId}-North`] },
    { name: 'Lions', location: 'Detroit', abbreviation: 'DET', divisionId: divisionMap[`${nfcId}-North`] },
    { name: 'Packers', location: 'Green Bay', abbreviation: 'GB', divisionId: divisionMap[`${nfcId}-North`] },
    { name: 'Vikings', location: 'Minnesota', abbreviation: 'MIN', divisionId: divisionMap[`${nfcId}-North`] },
    { name: 'Falcons', location: 'Atlanta', abbreviation: 'ATL', divisionId: divisionMap[`${nfcId}-South`] },
    { name: 'Panthers', location: 'Carolina', abbreviation: 'CAR', divisionId: divisionMap[`${nfcId}-South`] },
    { name: 'Saints', location: 'New Orleans', abbreviation: 'NO', divisionId: divisionMap[`${nfcId}-South`] },
    { name: 'Buccaneers', location: 'Tampa Bay', abbreviation: 'TB', divisionId: divisionMap[`${nfcId}-South`] },
    { name: 'Cardinals', location: 'Arizona', abbreviation: 'ARI', divisionId: divisionMap[`${nfcId}-West`] },
    { name: 'Rams', location: 'Los Angeles', abbreviation: 'LAR', divisionId: divisionMap[`${nfcId}-West`] },
    { name: '49ers', location: 'San Francisco', abbreviation: 'SF', divisionId: divisionMap[`${nfcId}-West`] },
    { name: 'Seahawks', location: 'Seattle', abbreviation: 'SEA', divisionId: divisionMap[`${nfcId}-West`] }
  ];

  const insertedTeams = await knex('teams')
    .insert(teams)
    .returning(['id', 'abbreviation', 'name', 'location']);

  const teamIds = insertedTeams.reduce((map, team) => {
    map[team.abbreviation] = team.id;
    map[team.abbreviation.toUpperCase()] = team.id;
    return map;
  }, {});

  const teamMeta = insertedTeams.reduce((map, team) => {
    map[team.abbreviation] = { id: team.id, name: team.name, location: team.location };
    return map;
  }, {});

  const [seasonRow] = await knex('seasons')
    .insert({ year: 2026 })
    .returning('id');

  const seasonId = seasonRow.id;

  const weeks = Array.from({ length: 18 }, (_, index) => ({
    weekNumber: index + 1,
    seasonId: seasonId,
    seasonType: 2
  }));

  const insertedWeeks = await knex('weeks')
    .insert(weeks)
    .returning(['id', 'weekNumber']);

  const weekIds = insertedWeeks.reduce((map, week) => {
    map[week.weekNumber] = week.id;
    return map;
  }, {});

  // Load official schedule JSON (generated by scripts/fetch_espn_schedule.js)
  const fs = require('fs');
  const path = require('path');
  const schedulePath = path.join(__dirname, 'schedule_2026.json');
  let scheduleData = [];
  if (fs.existsSync(schedulePath)) {
    try {
      scheduleData = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    } catch {
      scheduleData = [];
    }
  }

  // Build games directly from the fetched schedule data
  const scheduleGames = [];
  const kickoffsUTC = [];
  scheduleData.forEach((g) => {
    const weekNumber = g.week;
    const weekId = weekIds[weekNumber];
    if (!weekId) return; // skip if week missing

    const homeAbbr = g.home;
    const awayAbbr = g.away;
    const homeTeamId = teamIds[homeAbbr];
    const awayTeamId = teamIds[awayAbbr];
    if (!homeTeamId || !awayTeamId) return; // skip unknown teams

    const location = g.location || (teamMeta[homeAbbr] ? `${teamMeta[homeAbbr].location} Stadium` : '');

    if (g.startTimeUTC) kickoffsUTC.push(g.startTimeUTC);

    scheduleGames.push({
      seasonId: seasonId,
      weekId,
      homeTeamId,
      awayTeamId,
      startTimeEt: g.startTimeET || null,
      location: location,
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      result: null
    });
  });

  await knex('games').insert(scheduleGames);

  // lockAt = kickoff of the first game (SPEC §6.1); picks lock at this instant.
  // Derived from the schedule's canonical UTC kickoff so the lock check compares a
  // real UTC instant (the games table stores only ET-local startTimeEt for display).
  if (kickoffsUTC.length > 0) {
    const minKickoff = kickoffsUTC.reduce((min, kickoff) => (kickoff < min ? kickoff : min));
    await knex('seasons').where({ id: seasonId }).update({ lockAt: minKickoff });
  }
};
