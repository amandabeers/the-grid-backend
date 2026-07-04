const pick = require('../../api/services/pick');

const game = { id: 1, homeTeamId: 10, awayTeamId: 20, result: null };

describe('pick.validatePick', () => {
  it('accepts a tie and nulls the team', () => {
    expect(pick.validatePick(game, { pickType: 'tie', pickedTeamId: 10 }))
      .toEqual({ ok: true, pickedTeamId: null });
  });

  it('accepts a teamWin for a team in the game', () => {
    expect(pick.validatePick(game, { pickType: 'teamWin', pickedTeamId: 20 }))
      .toEqual({ ok: true, pickedTeamId: 20 });
  });

  it('rejects a teamWin for a team not in the game', () => {
    const res = pick.validatePick(game, { pickType: 'teamWin', pickedTeamId: 99 });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/one of the two teams/);
  });

  it('rejects an unknown pickType', () => {
    expect(pick.validatePick(game, { pickType: 'bogus' }).ok).toBe(false);
  });
});

describe('pick.isCorrect', () => {
  it('returns null when the result is unknown', () => {
    expect(pick.isCorrect({ pickType: 'tie' }, game)).toBeNull();
  });

  it('scores a tie pick against a tie result', () => {
    expect(pick.isCorrect({ pickType: 'tie' }, { ...game, result: 'tie' })).toBe(true);
    expect(pick.isCorrect({ pickType: 'tie' }, { ...game, result: 'homeWin' })).toBe(false);
  });

  it('scores a teamWin pick against the winner', () => {
    const g = { ...game, result: 'homeWin' };
    expect(pick.isCorrect({ pickType: 'teamWin', pickedTeamId: 10 }, g)).toBe(true);
    expect(pick.isCorrect({ pickType: 'teamWin', pickedTeamId: 20 }, g)).toBe(false);
  });

  it('marks a team pick wrong when the game was a tie', () => {
    const g = { ...game, result: 'tie' };
    expect(pick.isCorrect({ pickType: 'teamWin', pickedTeamId: 10 }, g)).toBe(false);
  });
});
