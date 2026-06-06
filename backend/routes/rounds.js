const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/roundController');
const { validate } = require('../middleware/validate');
const { MIN_BID, MAX_BID, MIN_ACTUAL_WINS, MAX_ACTUAL_WINS } = require('../config/constants');

const router = express.Router();

const scoreValueRules = [
  body('bid')
    .isFloat({ min: MIN_BID, max: MAX_BID })
    .withMessage(`bid must be between ${MIN_BID} and ${MAX_BID}`),
  body('actual_wins')
    .isFloat({ min: MIN_ACTUAL_WINS, max: MAX_ACTUAL_WINS })
    .withMessage(`actual_wins must be between ${MIN_ACTUAL_WINS} and ${MAX_ACTUAL_WINS}`),
];

const playerScoreSchema = [
  body('player_scores').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 player scores required'),
  body('player_scores.*.user_id').isUUID().withMessage('user_id must be a valid UUID'),
  body('player_scores.*.bid')
    .isFloat({ min: MIN_BID, max: MAX_BID })
    .withMessage(`bid must be between ${MIN_BID} and ${MAX_BID}`),
  body('player_scores.*.actual_wins')
    .isFloat({ min: MIN_ACTUAL_WINS, max: MAX_ACTUAL_WINS })
    .withMessage(`actual_wins must be between ${MIN_ACTUAL_WINS} and ${MAX_ACTUAL_WINS}`),
];

router.get(
  '/',
  query('match_id').isUUID().withMessage('match_id must be a valid UUID'),
  validate,
  controller.getRoundsForMatch
);

router.post(
  '/',
  body('match_id').isUUID().withMessage('match_id must be a valid UUID'),
  ...playerScoreSchema,
  validate,
  controller.createRound
);

router.put(
  '/:id',
  param('id').isUUID().withMessage('Invalid round ID'),
  ...playerScoreSchema,
  validate,
  controller.updateRound
);

router.patch(
  '/:id/scores/:userId',
  param('id').isUUID().withMessage('Invalid round ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
  ...scoreValueRules,
  validate,
  controller.patchRoundScore
);

router.delete(
  '/:id',
  param('id').isUUID().withMessage('Invalid round ID'),
  validate,
  controller.deleteRound
);

module.exports = router;
