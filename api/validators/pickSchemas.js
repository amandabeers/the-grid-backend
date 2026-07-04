const Joi = require('joi');
const { PICK_TYPE } = require('../services/enums.js');

// A pick is either a team to win (requires pickedTeamId) or a tie (no team).
// That pickedTeamId belongs to the game is checked in the controller, not here.
// The number check lives inside the teamWin branch so a tie may send an explicit
// pickedTeamId: null (or omit it, or send any value) — all dropped; the controller
// stores null. Keeping number() on the base would reject an explicit null.
const setPickSchema = Joi.object({
  pickType: Joi.string().valid(...PICK_TYPE).required(),
  pickedTeamId: Joi.any().when('pickType', {
    is: 'teamWin',
    then: Joi.number().integer().required(),
    otherwise: Joi.any().strip(),
  }),
});

module.exports = { setPickSchema };
