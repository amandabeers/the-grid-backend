const Joi = require('joi');

// A pick is either a team to win (requires picked_team_id) or a tie (no team).
// That picked_team_id belongs to the game is checked in the controller, not here.
const setPickSchema = Joi.object({
  pick_type: Joi.string().valid('team_win', 'tie').required(),
  picked_team_id: Joi.number().integer().when('pick_type', {
    is: 'team_win',
    then: Joi.required(),
    // Irrelevant for a tie: drop any value the client sends; the controller
    // stores null.
    otherwise: Joi.any().strip(),
  }),
});

module.exports = { setPickSchema };
