/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Delete in FK-safe order (children before parents).
  await knex('picks').del();
  await knex('games').del();
  await knex('weeks').del();
  await knex('invites').del();
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
    { name: 'East', conference_id: afcId },
    { name: 'North', conference_id: afcId },
    { name: 'South', conference_id: afcId },
    { name: 'West', conference_id: afcId },
    { name: 'East', conference_id: nfcId },
    { name: 'North', conference_id: nfcId },
    { name: 'South', conference_id: nfcId },
    { name: 'West', conference_id: nfcId }
  ];

  const insertedDivisions = await knex('divisions')
    .insert(divisions)
    .returning(['id', 'name', 'conference_id']);

  const divisionMap = insertedDivisions.reduce((map, division) => {
    const key = `${division.conference_id}-${division.name}`;
    map[key] = division.id;
    return map;
  }, {});

  const teams = [
    { name: 'Bills', location: 'Buffalo', abbreviation: 'BUF', division_id: divisionMap[`${afcId}-East`] },
    { name: 'Dolphins', location: 'Miami', abbreviation: 'MIA', division_id: divisionMap[`${afcId}-East`] },
    { name: 'Patriots', location: 'New England', abbreviation: 'NE', division_id: divisionMap[`${afcId}-East`] },
    { name: 'Jets', location: 'New York', abbreviation: 'NYJ', division_id: divisionMap[`${afcId}-East`] },
    { name: 'Ravens', location: 'Baltimore', abbreviation: 'BAL', division_id: divisionMap[`${afcId}-North`] },
    { name: 'Bengals', location: 'Cincinnati', abbreviation: 'CIN', division_id: divisionMap[`${afcId}-North`] },
    { name: 'Browns', location: 'Cleveland', abbreviation: 'CLE', division_id: divisionMap[`${afcId}-North`] },
    { name: 'Steelers', location: 'Pittsburgh', abbreviation: 'PIT', division_id: divisionMap[`${afcId}-North`] },
    { name: 'Texans', location: 'Houston', abbreviation: 'HOU', division_id: divisionMap[`${afcId}-South`] },
    { name: 'Colts', location: 'Indianapolis', abbreviation: 'IND', division_id: divisionMap[`${afcId}-South`] },
    { name: 'Jaguars', location: 'Jacksonville', abbreviation: 'JAX', division_id: divisionMap[`${afcId}-South`] },
    { name: 'Titans', location: 'Tennessee', abbreviation: 'TEN', division_id: divisionMap[`${afcId}-South`] },
    { name: 'Broncos', location: 'Denver', abbreviation: 'DEN', division_id: divisionMap[`${afcId}-West`] },
    { name: 'Chiefs', location: 'Kansas City', abbreviation: 'KC', division_id: divisionMap[`${afcId}-West`] },
    { name: 'Raiders', location: 'Las Vegas', abbreviation: 'LV', division_id: divisionMap[`${afcId}-West`] },
    { name: 'Chargers', location: 'Los Angeles', abbreviation: 'LAC', division_id: divisionMap[`${afcId}-West`] },
    { name: 'Cowboys', location: 'Dallas', abbreviation: 'DAL', division_id: divisionMap[`${nfcId}-East`] },
    { name: 'Giants', location: 'New York', abbreviation: 'NYG', division_id: divisionMap[`${nfcId}-East`] },
    { name: 'Eagles', location: 'Philadelphia', abbreviation: 'PHI', division_id: divisionMap[`${nfcId}-East`] },
    { name: 'Commanders', location: 'Washington', abbreviation: 'WSH', division_id: divisionMap[`${nfcId}-East`] },
    { name: 'Bears', location: 'Chicago', abbreviation: 'CHI', division_id: divisionMap[`${nfcId}-North`] },
    { name: 'Lions', location: 'Detroit', abbreviation: 'DET', division_id: divisionMap[`${nfcId}-North`] },
    { name: 'Packers', location: 'Green Bay', abbreviation: 'GB', division_id: divisionMap[`${nfcId}-North`] },
    { name: 'Vikings', location: 'Minnesota', abbreviation: 'MIN', division_id: divisionMap[`${nfcId}-North`] },
    { name: 'Falcons', location: 'Atlanta', abbreviation: 'ATL', division_id: divisionMap[`${nfcId}-South`] },
    { name: 'Panthers', location: 'Carolina', abbreviation: 'CAR', division_id: divisionMap[`${nfcId}-South`] },
    { name: 'Saints', location: 'New Orleans', abbreviation: 'NO', division_id: divisionMap[`${nfcId}-South`] },
    { name: 'Buccaneers', location: 'Tampa Bay', abbreviation: 'TB', division_id: divisionMap[`${nfcId}-South`] },
    { name: 'Cardinals', location: 'Arizona', abbreviation: 'ARI', division_id: divisionMap[`${nfcId}-West`] },
    { name: 'Rams', location: 'Los Angeles', abbreviation: 'LAR', division_id: divisionMap[`${nfcId}-West`] },
    { name: '49ers', location: 'San Francisco', abbreviation: 'SF', division_id: divisionMap[`${nfcId}-West`] },
    { name: 'Seahawks', location: 'Seattle', abbreviation: 'SEA', division_id: divisionMap[`${nfcId}-West`] }
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
    week_number: index + 1,
    season_id: seasonId,
    season_type: 2
  }));

  const insertedWeeks = await knex('weeks')
    .insert(weeks)
    .returning(['id', 'week_number']);

  const weekIds = insertedWeeks.reduce((map, week) => {
    map[week.week_number] = week.id;
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
    } catch (e) {
      scheduleData = [];
    }
  }

  // Build games directly from the fetched schedule data
  const scheduleGames = [];
  scheduleData.forEach((g) => {
    const weekNumber = g.week;
    const week_id = weekIds[weekNumber];
    if (!week_id) return; // skip if week missing

    const homeAbbr = g.home;
    const awayAbbr = g.away;
    const home_team_id = teamIds[homeAbbr];
    const away_team_id = teamIds[awayAbbr];
    if (!home_team_id || !away_team_id) return; // skip unknown teams

    const location = g.location || (teamMeta[homeAbbr] ? `${teamMeta[homeAbbr].location} Stadium` : '');

    scheduleGames.push({
      season_id: seasonId,
      week_id,
      home_team_id,
      away_team_id,
      kickoff_at: g.startTimeUTC || null, // canonical UTC kickoff
      start_time_et: g.startTimeET || null,
      location: location,
      status: 'scheduled',
      home_score: null,
      away_score: null,
      result: null
    });
  });

  await knex('games').insert(scheduleGames);

  // lock_at = kickoff of the first game (SPEC §5.3); picks lock at this instant.
  const kickoffs = scheduleGames
    .map((game) => game.kickoff_at)
    .filter((kickoff) => kickoff);
  if (kickoffs.length > 0) {
    const minKickoff = kickoffs.reduce((min, kickoff) => (kickoff < min ? kickoff : min));
    await knex('seasons').where({ id: seasonId }).update({ lock_at: minKickoff });
  }
};
