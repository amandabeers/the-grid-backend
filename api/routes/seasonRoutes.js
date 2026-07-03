const express = require('express');
const requireAuth = require('../../middleware/requireAuth.js');
const loadSeason = require('../../middleware/loadSeason.js');
const requireUnlocked = require('../../middleware/requireUnlocked.js');
const validate = require('../../middleware/validate.js');
const { setPickSchema } = require('../validators/pickSchemas.js');
const gameController = require('../controllers/gameController.js');
const pickController = require('../controllers/pickController.js');
const gridController = require('../controllers/gridController.js');

const router = express.Router();

// Every season route is member-only.
router.use(requireAuth);

router.get('/:year/games', loadSeason, gameController.listGames);
router.get('/:year/picks/me', loadSeason, pickController.getMyPicks);
router.put(
  '/:year/picks/:gameId',
  loadSeason,
  requireUnlocked,
  validate(setPickSchema),
  pickController.setPick,
);
router.post('/:year/picks/randomize', loadSeason, requireUnlocked, pickController.randomize);
router.post('/:year/grid/submit', loadSeason, gridController.submit);

module.exports = router;
