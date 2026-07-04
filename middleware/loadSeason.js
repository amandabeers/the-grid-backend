const seasonDb = require('../api/db/seasonDb.js');

// Resolves :year to a season row and attaches it as req.season. 404 if unknown.
const loadSeason = async (req, res, next) => {
  const season = await seasonDb.findByYear(req.params.year);
  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }
  req.season = season;
  next();
};

module.exports = loadSeason;
