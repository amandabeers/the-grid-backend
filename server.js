require('dotenv').config();
const app = require('./app.js');
const knex = require('./database/connection.js');

const checkConnection = async () => {
  try {
    const conferences = await knex('conferences');
    console.log('Database connected successfully', conferences.length, 'conferences');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

checkConnection();

const port = process.env.PORT || 4743;

app.listen(port, () => {
    console.log(`Server listening on ${port}`)
});

module.exports = app;
