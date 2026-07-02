const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const knex = require('./database/connection.js');

const authRoutes = require('./api/routes/authRoutes.js');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

// middleware
app.use(helmet());
// set CORS headers on response from this API using the `cors` NPM package.
// `credentials: true` is required so the browser sends/stores the auth cookie.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ||
  `http://localhost:${process.env.CLIENT_DEV_PORT}`,
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/conferences', async (req, res) => {
  const conferences = await knex('conferences');
  res.json(conferences);
});

// routes
app.use('/api/auth', authRoutes);

// error handler (must be last)
app.use(errorHandler);

module.exports = app;
