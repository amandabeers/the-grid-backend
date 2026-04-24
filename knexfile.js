// Update with your config settings.
require('dotenv').config();
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      database: process.env.PGDATABASE,
      user:     process.env.PGUSER,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT
    },
    pool: {
      afterCreate: (conn, done) => {
        console.log(process.env.PGDATABASE);
        console.log('Connection established');
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
    client: 'pg',
    connection: {
      database: process.env.PGDATABASE,
      user:     process.env.PGUSER,
      password: process.env.PGPASSWORD
    },
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
    client: 'pg',
    connection: process.env.PGDATABASE_URL,
    pool: {
      min: 0,
      max: 10
    },
    migrations: {
      directory: __dirname + '/database/migrations',
      tableName: 'knex_migrations'
    }
  }

};
