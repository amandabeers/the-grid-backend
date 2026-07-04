const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const authRoutes = require('./api/routes/authRoutes.js');
const seasonRoutes = require('./api/routes/seasonRoutes.js');
const teamRoutes = require('./api/routes/teamRoutes.js');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

// Trust one proxy hop so express-rate-limit (and req.ip) key on the real client
// IP rather than the reverse proxy's. Adjust the hop count to match deployment.
app.set('trust proxy', 1);

// middleware
app.use(helmet());
// set CORS headers on response from this API using the `cors` NPM package.
// `credentials: true` is required so the browser sends/stores the auth cookie.
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ||
  `http://localhost:${process.env.CLIENT_DEV_PORT || 5173}`,
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

// Liveness/health check.
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/seasons', seasonRoutes);
app.use('/api/teams', teamRoutes);

// error handler (must be last)
app.use(errorHandler);

module.exports = app;
