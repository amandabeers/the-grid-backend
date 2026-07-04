const season = require('../../api/services/season');

describe('season.isLocked', () => {
  const now = new Date('2026-09-10T00:00:00Z');

  it('is not locked when lockAt is null (schedule not imported)', () => {
    expect(season.isLocked({ lockAt: null }, now)).toBe(false);
  });

  it('is not locked before lockAt', () => {
    expect(season.isLocked({ lockAt: '2026-09-10T00:00:01Z' }, now)).toBe(false);
  });

  it('is locked at exactly lockAt', () => {
    expect(season.isLocked({ lockAt: '2026-09-10T00:00:00Z' }, now)).toBe(true);
  });

  it('is locked after lockAt', () => {
    expect(season.isLocked({ lockAt: '2026-09-09T23:59:59Z' }, now)).toBe(true);
  });
});
