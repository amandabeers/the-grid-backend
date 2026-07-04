const season = require('../api/services/season.js');

// Blocks pick mutations once the season has locked (SPEC §6.1). The lock rule
// lives in services/season; a null lockAt means picks are still open.
// Requires loadSeason to have run first (sets req.season).
const requireUnlocked = (req, res, next) => {
  if (season.isLocked(req.season)) {
    return res.status(423).json({ error: 'Picks are locked; the season has started' });
  }
  next();
};

module.exports = requireUnlocked;
