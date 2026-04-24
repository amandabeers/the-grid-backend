require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const knex = require('./database/connection.js');

const checkConnection = async () => {
  try {
    const confs = await knex.raw('SELECT * FROM conference');
    console.log('Database connected successfully', confs.rows);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
};

checkConnection();

// initialize
const app = express();

// middleware
app.use(helmet());
// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ||
  `http://localhost:${process.env.CLIENT_DEV_PORT}`
}));
// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const port = process.env.PORT || 4743;

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/conferences', async (req, res) => {
  const conferences = await knex('conference');
  console.log('GET', conferences);
  res.json(conferences);
});

// start server
app.listen(port, () => {
    console.log(`Server listening on ${port}`)
});

module.exports = app;
