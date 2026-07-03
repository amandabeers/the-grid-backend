// Blocks pick mutations once the season has locked (SPEC §6.1). Lock is the
// whole-season instant seasons.lock_at; a null lock_at means picks are still open.
// Requires loadSeason to have run first (sets req.season).
const requireUnlocked = (req, res, next) => {
  const { lock_at } = req.season;
  if (lock_at && new Date(lock_at) <= new Date()) {
    return res.status(423).json({ error: 'Picks are locked; the season has started' });
  }
  next();
};

module.exports = requireUnlocked;
