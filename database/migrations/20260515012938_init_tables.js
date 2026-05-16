/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema
    .createTable('conference', (table) => {
      table.increments('id').primary(),
      table.string('name').notNullable(),
      table.string('abbrv').notNullable()
    });

  await knex.schema
    .createTable('division', (table) => {
      table.increments('id').primary(),
      table.string('name').notNullable(),
      table.integer('conference_id').unsigned().notNullable();
      table.foreign('conference_id')
        .references('id')
        .inTable('conference')
        .onDelete('CASCADE');
    });
  
  await knex.schema
    .createTable('team', (table) => {
      table.increments('id').primary(),
      table.string('name').notNullable(),
      table.string('place').notNullable(),
      table.string('abbrv').notNullable(),
      table.string('logo'),
      table.integer('division_id').unsigned().notNullable();
      table.foreign('division_id')
        .references('id')
        .inTable('division')
        .onDelete('CASCADE');
    });

  await knex.schema
    .createTable('season', (table) => {
      table.increments('id').primary(),
      table.integer('startYear').notNullable()
    });

  await knex.schema
    .createTable('week', (table) => {
      table.increments('id').primary(),
      table.integer('weekNumber').notNullable(),
      table.integer('season_id').unsigned().notNullable();
      table.foreign('season_id')
        .references('id')
        .inTable('season')
        .onDelete('CASCADE');
    });

  await knex.schema
    .createTable('game', (table) => {
      table.increments('id').primary(),
      table.date('date').notNullable(),
      table.time('time').notNullable(), 
      table.string('location').notNullable(),
      table.integer('homeScore'),
      table.integer('awayScore'),
      table.boolean('isOver').defaultTo(false),
      table.integer('week_id').unsigned().notNullable();
      table.foreign('week_id')
        .references('id')
        .inTable('week')
        .onDelete('CASCADE');
      table.integer('homeTeam_id').unsigned().notNullable();
      table.foreign('homeTeam_id')
        .references('id')
        .inTable('team')
        .onDelete('CASCADE');
      table.integer('awayTeam_id').unsigned().notNullable();
      table.foreign('awayTeam_id')
        .references('id')
        .inTable('team')
        .onDelete('CASCADE');
    });
  
  await knex.schema
    .createTable('outcome', (table) => {
      table.increments('id').primary(),
      table.enu('result', ['W', 'L', 'T'], {
        useNative: true,
        enumName: 'outcome_type'
      }),
      table.integer('team_id').unsigned().notNullable();
      table.foreign('team_id')
        .references('id')
        .inTable('team')
        .onDelete('CASCADE');
      table.integer('game_id').unsigned().notNullable();
      table.foreign('game_id')
        .references('id')
        .inTable('game')
        .onDelete('CASCADE');
    });

  await knex.schema
    .createTable('user', (table) => {
      table.increments('id').primary(),
      table.string('username').notNullable(),
      table.string('password').notNullable(),
      table.string('timeZone').notNullable().defaultTo('EST')
    });

  await knex.schema
    .createTable('pick', (table) => {
      table.increments('id').primary(),
      table.boolean('isCorrect'),
      table.boolean('isTie'),
      table.integer('game_id').unsigned().notNullable();
      table.foreign('game_id')
        .references('id')
        .inTable('game')
        .onDelete('CASCADE');
      table.integer('team_id').unsigned().notNullable();
      table.foreign('team_id')
        .references('id')
        .inTable('team')
        .onDelete('CASCADE');
      table.integer('user_id').unsigned().notNullable();
      table.foreign('user_id')
        .references('id')
        .inTable('user')
        .onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
  .dropTable('pick')
  .dropTable('user')
  .dropTable('outcome')
  .raw('DROP TYPE IF EXISTS outcome_type')
  .dropTable('game')
  .dropTable('week')
  .dropTable('season')
  .dropTable('team')
  .dropTable('division')
  .dropTable('conference');
};
