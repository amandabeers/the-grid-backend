const game = require('../../api/services/game');

describe('game.resultFromScores', () => {
  it('returns null until both scores are present', () => {
    expect(game.resultFromScores({ homeScore: null, awayScore: 3 })).toBeNull();
    expect(game.resultFromScores({ homeScore: 3, awayScore: null })).toBeNull();
  });

  it('derives homeWin / awayWin / tie', () => {
    expect(game.resultFromScores({ homeScore: 24, awayScore: 17 })).toBe('homeWin');
    expect(game.resultFromScores({ homeScore: 10, awayScore: 27 })).toBe('awayWin');
    expect(game.resultFromScores({ homeScore: 20, awayScore: 20 })).toBe('tie');
  });

  it('treats 0-0 as a tie, not missing', () => {
    expect(game.resultFromScores({ homeScore: 0, awayScore: 0 })).toBe('tie');
  });
});
