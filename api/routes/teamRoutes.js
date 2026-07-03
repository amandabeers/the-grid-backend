const express = require('express');
const requireAuth = require('../../middleware/requireAuth.js');
const teamController = require('../controllers/teamController.js');

const router = express.Router();

// Teams are member-only reference data.
router.use(requireAuth);

router.get('/', teamController.listTeams);

module.exports = router;
