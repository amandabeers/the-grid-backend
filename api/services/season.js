// Season lifecycle rules (SPEC §6.1). Pure — operates on an already-loaded season row.

// Picks lock at the whole-season instant seasons.lockAt (first kickoff). A null
// lockAt means the schedule hasn't been imported yet, so picks are still open.
const isLocked = (season, now = new Date()) => {
  const { lockAt } = season;
  return lockAt != null && new Date(lockAt) <= now;
};

module.exports = { isLocked };
