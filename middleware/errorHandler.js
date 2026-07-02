// Final Express error handler. Express 5 forwards async rejections here,
// so controllers can throw. Known errors carry a `.status`; everything
// else is treated as a 500 and logged.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: err.expose ? err.message : messageFor(status) });
};

const messageFor = (status) => {
  if (status === 500) return 'Internal server error';
  return 'Request failed';
};

module.exports = errorHandler;
