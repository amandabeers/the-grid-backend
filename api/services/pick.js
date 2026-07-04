// Pick rules (SPEC §3.1, §5.8, §6.3). Pure — operates on already-loaded rows.

// Validate a pick against its game. Returns the normalized pickedTeamId (null for
// a tie) on success, or an error string. A teamWin must target one of the game's
// two teams; a tie carries no team.
const validatePick = (game, { pickType, pickedTeamId }) => {
  if (pickType === 'tie') {
    return { ok: true, pickedTeamId: null };
  }
  if (pickType === 'teamWin') {
    if (![game.homeTeamId, game.awayTeamId].includes(pickedTeamId)) {
      return { ok: false, error: 'pickedTeamId must be one of the two teams in this game' };
    }
    return { ok: true, pickedTeamId };
  }
  return { ok: false, error: 'Unknown pickType' };
};

// Whether a pick was correct given the game's final result (SPEC §6.3):
// teamWin is correct iff the picked team won; a tie iff the game ended tied.
// Returns null when the result isn't known yet.
const isCorrect = (pick, game, result = game && game.result) => {
  if (result == null) return null;
  if (pick.pickType === 'tie') return result === 'tie';
  if (result === 'homeWin') return pick.pickedTeamId === game.homeTeamId;
  if (result === 'awayWin') return pick.pickedTeamId === game.awayTeamId;
  return false; // result === 'tie' but the user picked a team
};

module.exports = { validatePick, isCorrect };
