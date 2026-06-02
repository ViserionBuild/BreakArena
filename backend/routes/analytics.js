const express = require('express');
const { param } = require('express-validator');
const controller = require('../controllers/analyticsController');
const { validate } = require('../middleware/validate');

const router = express.Router();

// GET /analytics/leaderboard
router.get('/leaderboard', controller.getGlobalLeaderboard);

// GET /analytics/matches/:matchId
router.get(
  '/matches/:matchId',
  param('matchId').isUUID().withMessage('Invalid match ID'),
  validate,
  controller.getMatchAnalytics
);

module.exports = router;
