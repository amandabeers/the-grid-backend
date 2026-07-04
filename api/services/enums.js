// Single source of truth for the enumerated text columns (SPEC §5). These mirror
// the CHECK constraints in the init migration; validators and services reference
// these instead of repeating string literals.

const USER_ROLE = Object.freeze(['member', 'admin']);
const SEASON_STATUS = Object.freeze(['upcoming', 'picksOpen', 'locked', 'inProgress', 'completed']);
const GAME_STATUS = Object.freeze(['scheduled', 'inProgress', 'final']);
const GAME_RESULT = Object.freeze(['homeWin', 'awayWin', 'tie']);
const PICK_TYPE = Object.freeze(['teamWin', 'tie']);

module.exports = { USER_ROLE, SEASON_STATUS, GAME_STATUS, GAME_RESULT, PICK_TYPE };
