// Blocks pick mutations once the season has locked (SPEC §6.1). Lock is the
// whole-season instant seasons.lockAt; a null lockAt means picks are still open.
// Requires loadSeason to have run first (sets req.season).
const requireUnlocked = (req, res, next) => {
  const { lockAt } = req.season;
  if (lockAt && new Date(lockAt) <= new Date()) {
    return res.status(423).json({ error: 'Picks are locked; the season has started' });
  }
  next();
};

module.exports = requireUnlocked;
