const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/roundController');
const { validate } = require('../middleware/validate');
const { MIN_BID, MAX_BID } = require('../config/constants');

const router = express.Router();

const playerScoreSchema = [
  body('player_scores').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 player scores required'),
  body('player_scores.*.user_id').isUUID().withMessage('user_id must be a valid UUID'),
  body('player_scores.*.bid')
    .isInt({ min: MIN_BID, max: MAX_BID })
    .withMessage(`bid must be between ${MIN_BID} and ${MAX_BID}`),
  body('player_scores.*.actual_wins')
    .isInt({ min: 0, max: 13 })
    .withMessage('actual_wins must be between 0 and 13'),
];

// GET /rounds?match_id=...
router.get(
  '/',
  query('match_id').isUUID().withMessage('match_id must be a valid UUID'),
  validate,
  controller.getRoundsForMatch
);

// POST /rounds
router.post(
  '/',
  body('match_id').isUUID().withMessage('match_id must be a valid UUID'),
  ...playerScoreSchema,
  validate,
  controller.createRound
);

// PUT /rounds/:id
router.put(
  '/:id',
  param('id').isUUID().withMessage('Invalid round ID'),
  ...playerScoreSchema,
  validate,
  controller.updateRound
);

// DELETE /rounds/:id
router.delete(
  '/:id',
  param('id').isUUID().withMessage('Invalid round ID'),
  validate,
  controller.deleteRound
);

module.exports = router;
