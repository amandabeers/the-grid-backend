// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DEV_DATABASE
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, done) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        console.log('Connection established', process.env.DEV_DATABASE);
        done();
      }
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    },
    // debug: true,
    seeds: {
      directory: __dirname + '/database/seeds'
    }
  },

  staging: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DEV_DATABASE
    },
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 10
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'better-sqlite3',
    connection: process.env.DATABASE_URL,
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 10,
      afterCreate: (conn, done) => {
        conn.pragma('journal_mode = WAL');
        conn.pragma('foreign_keys = ON');
        console.log('Connection established', process.env.DATABASE_URL);
        done();
      }
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: __dirname + '/database/seeds'
    }
  }

};
