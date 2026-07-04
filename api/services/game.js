// Game scoring rules (SPEC §6.3). Pure — operates on an already-loaded game row.

// Derive games.result from the final score. Returns 'homeWin' | 'awayWin' | 'tie',
// or null if either score is missing (game not final yet).
const resultFromScores = (game) => {
  const { homeScore, awayScore } = game;
  if (homeScore == null || awayScore == null) return null;
  if (homeScore > awayScore) return 'homeWin';
  if (awayScore > homeScore) return 'awayWin';
  return 'tie';
};

module.exports = { resultFromScores };
