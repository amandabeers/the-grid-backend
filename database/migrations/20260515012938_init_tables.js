/**
 * Reconciled to SPEC.md §5. Tables are plural; columns are camelCase; the
 * `outcome` table is gone (outcome lives on `games.result`, per-pick
 * correctness on `picks.isCorrect`). Enumerated columns are plain text with
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
    table.string('passwordHash').notNullable();
    table.string('role').notNullable().defaultTo('member').checkIn(['member', 'admin']);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('seasons', (table) => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.datetime('lockAt').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('upcoming')
      .checkIn(['upcoming', 'picksOpen', 'locked', 'inProgress', 'completed']);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('conferences', (table) => {
    table.increments('id').primary();
    table.string('espnConferenceId').unique().nullable();
    table.string('name').notNullable();
    table.string('abbreviation').notNullable();
  });

  await knex.schema.createTable('divisions', (table) => {
    table.increments('id').primary();
    table
      .integer('conferenceId')
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
    table.string('espnTeamId').unique().nullable();
    table
      .integer('divisionId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('divisions')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('location').nullable();
    table.string('abbreviation').notNullable();
    table.string('logoUrl').nullable();
  });

  await knex.schema.createTable('weeks', (table) => {
    table.increments('id').primary();
    table
      .integer('seasonId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('seasons')
      .onDelete('CASCADE');
    table.integer('weekNumber').notNullable();
    table.integer('seasonType').notNullable().defaultTo(2);
  });

  await knex.schema.createTable('games', (table) => {
    table.increments('id').primary();
    table
      .integer('seasonId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('seasons')
      .onDelete('CASCADE');
    table
      .integer('weekId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('weeks')
      .onDelete('CASCADE');
    table.string('espnEventId').unique().nullable();
    table
      .integer('homeTeamId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table
      .integer('awayTeamId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table.datetime('startTimeEt').nullable();
    table.string('location').nullable();
    table
      .string('status')
      .notNullable()
      .defaultTo('scheduled')
      .checkIn(['scheduled', 'inProgress', 'final']);
    table.integer('homeScore').nullable();
    table.integer('awayScore').nullable();
    table.string('result').nullable().checkIn(['homeWin', 'awayWin', 'tie']);
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('picks', (table) => {
    table.increments('id').primary();
    table
      .integer('userId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('gameId')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');
    table
      .integer('pickedTeamId')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('teams')
      .onDelete('CASCADE');
    table.string('pickType').notNullable().checkIn(['teamWin', 'tie']);
    table.boolean('isCorrect').nullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    table.unique(['userId', 'gameId']);
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
