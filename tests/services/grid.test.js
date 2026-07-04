const grid = require('../../api/services/grid');

const games = [
  { id: 1, homeTeamId: 10, awayTeamId: 11 },
  { id: 2, homeTeamId: 20, awayTeamId: 21 },
  { id: 3, homeTeamId: 30, awayTeamId: 31 },
];

describe('grid.evaluate', () => {
  it('is complete when every game is picked and at least one is a tie', () => {
    const picks = [
      { gameId: 1, pickType: 'teamWin' },
      { gameId: 2, pickType: 'tie' },
      { gameId: 3, pickType: 'teamWin' },
    ];
    expect(grid.evaluate(games, picks)).toEqual({
      complete: true, reasons: [], missingCount: 0, hasTie: true,
    });
  });

  it('reports unpicked games', () => {
    const picks = [{ gameId: 1, pickType: 'tie' }];
    const res = grid.evaluate(games, picks);
    expect(res.complete).toBe(false);
    expect(res.missingCount).toBe(2);
    expect(res.reasons).toContain('2 games unpicked');
  });

  it('requires at least one tie', () => {
    const picks = games.map((g) => ({ gameId: g.id, pickType: 'teamWin' }));
    const res = grid.evaluate(games, picks);
    expect(res.complete).toBe(false);
    expect(res.reasons).toEqual(['no tie pick']);
  });
});

describe('grid.randomPickRows', () => {
  it('covers every game and forces exactly one tie', () => {
    const rows = grid.randomPickRows(games, 7);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.gameId).sort()).toEqual([1, 2, 3]);
    expect(rows.every((r) => r.userId === 7)).toBe(true);
    expect(rows.filter((r) => r.pickType === 'tie')).toHaveLength(1);
    rows.filter((r) => r.pickType === 'teamWin').forEach((r) => {
      expect(r.pickedTeamId == null).toBe(false);
    });
  });

  it('returns no rows when there are no games', () => {
    expect(grid.randomPickRows([], 7)).toEqual([]);
  });
});
