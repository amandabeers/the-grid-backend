// Grid rules (SPEC §6.2, §6.5). A Grid is one user's picks for one season, a
// derived view (§5.9) — these functions operate on already-loaded games/picks.

// Completeness check (SPEC §6.2): every game has a pick AND at least one is a tie.
// Returns { complete, reasons, missingCount, hasTie }; reasons mirror the strings
// the /grid/submit endpoint returns.
const evaluate = (games, picks) => {
  const pickedGameIds = new Set(picks.map((p) => p.gameId));
  const missingCount = games.filter((g) => !pickedGameIds.has(g.id)).length;
  const hasTie = picks.some((p) => p.pickType === 'tie');

  const reasons = [];
  if (missingCount > 0) reasons.push(`${missingCount} games unpicked`);
  if (!hasTie) reasons.push('no tie pick');

  return { complete: reasons.length === 0, reasons, missingCount, hasTie };
};

// Randomize (SPEC §6.5): a random winner for every game, then one random game
// forced to a tie so the "≥1 tie" rule holds. Returns pick rows ready to insert.
const randomPickRows = (games, userId) => {
  const rows = games.map((game) => ({
    userId,
    gameId: game.id,
    pickedTeamId: Math.random() < 0.5 ? game.homeTeamId : game.awayTeamId,
    pickType: 'teamWin',
  }));

  if (rows.length) {
    const tieIndex = Math.floor(Math.random() * rows.length);
    rows[tieIndex] = { userId, gameId: rows[tieIndex].gameId, pickedTeamId: null, pickType: 'tie' };
  }

  return rows;
};

module.exports = { evaluate, randomPickRows };
