const express = require('express');
const { param } = require('express-validator');
const controller = require('../controllers/analyticsController');
const { validate } = require('../middleware/validate');
const { requireGroup } = require('../middleware/requireGroup');

const router = express.Router();

// All analytics routes require group auth
router.use(requireGroup);

// GET /analytics/leaderboard
router.get('/leaderboard', controller.getGlobalLeaderboard);

// GET /analytics/player-accuracy
router.get('/player-accuracy', controller.getPlayerBidAccuracy);

// GET /analytics/matches/:matchId
router.get(
  '/matches/:matchId',
  param('matchId').isUUID().withMessage('Invalid match ID'),
  validate,
  controller.getMatchAnalytics
);

module.exports = router;

