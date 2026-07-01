/**
 * Reconciled to SPEC.md §5. Table/column names are plural snake_case; the
 * `outcome` table is gone (outcome lives on `games.result`, per-pick
 * correctness on `picks.is_correct`). Enumerated columns are plain text with
 * CHECK constraints (`checkIn`) rather than Postgres native enums, since the
 * database is `better-sqlite3`. ESPN id columns are unique-but-nullable so the
 * current seed (which has no ESPN ids yet) can still insert.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().unique();
    table.string('username').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('role').notNullable().defaultTo('member').checkIn(['member', 'admin']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('seasons', (table) => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.datetime('lock_at').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('upcoming')
      .checkIn(['upcoming', 'picks_open', 'locked', 'in_progress', 'completed']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('conferences', (table) => {
    table.increments('id').primary();
    table.string('espn_conference_id').unique().nullable();
    table.string('name').notNullable();
    table.string('abbreviation').notNullable();
    table.json('metadata').nullable();
  });

  await knex.schema.createTable('divisions', (table) => {
    table.increments('id').primary();
    table
      .integer('conference_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('conferences')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('abbreviation').nullable();
  });

  await knex.schema.createTable('teams', (table) => {
    table.increments('id').primary();
    table.string('espn_team_id').unique().nullable();
    table
      .integer('division_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('divisions')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('location').nullable();
    table.string('abbreviation').notNullable();
    table.string('logo_url').nullable();
    table.json('metadata').nullable();
  });

  await knex.schema.createTable('weeks', (table) => {
    table.increments('id').primary();
    table
      .integer('season_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('seasons')
      .onDelete('CASCADE');
    table.integer('week_number').notNullable();
    table.integer('season_type').notNullable().defaultTo(2);
  });

  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table
      .integer('season_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('seasons')
      .onDelete('CASCADE');
    table
      .integer('week_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('weeks')
      .onDelete('CASCADE');
    table.string('espn_event_id').unique().nullable();
    table
      .integer('home_team_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table
      .integer('away_team_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table.datetime('kickoff_at').nullable();
    table.datetime('start_time_et').nullable();
    table.string('location').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('scheduled')
      .checkIn(['scheduled', 'in_progress', 'final']);
    table.integer('home_score').nullable();
    table.integer('away_score').nullable();
    table.string('result').nullable().checkIn(['home_win', 'away_win', 'tie']);
    table.json('raw_data').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('picks', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('game_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');
    table
      .integer('picked_team_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table.string('pick_type').notNullable().checkIn(['team_win', 'tie']);
    table.boolean('is_correct').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'game_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('picks')
    .dropTableIfExists('games')
    .dropTableIfExists('weeks')
    .dropTableIfExists('teams')
    .dropTableIfExists('divisions')
    .dropTableIfExists('conferences')
    .dropTableIfExists('seasons')
    .dropTableIfExists('users');
};
