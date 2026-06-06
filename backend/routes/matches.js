const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/matchController');
const { validate } = require('../middleware/validate');
const { MATCH_STATUS, PLAYERS_PER_MATCH, MAX_TOTAL_ROUNDS } = require('../config/constants');

const router = express.Router();

const uuidParam = param('id').isUUID().withMessage('Invalid match ID');

router.get(
  '/',
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status')
    .optional()
    .isIn(Object.values(MATCH_STATUS))
    .withMessage('Invalid status'),
  validate,
  controller.listMatches
);

router.get('/:id', uuidParam, validate, controller.getMatch);

router.post(
  '/',
  body('player_ids')
    .isArray({ min: PLAYERS_PER_MATCH, max: PLAYERS_PER_MATCH })
    .withMessage(`Exactly ${PLAYERS_PER_MATCH} player IDs required`),
  body('player_ids.*').isUUID().withMessage('Each player ID must be a valid UUID'),
  body('total_rounds')
    .optional()
    .isInt({ min: 1, max: MAX_TOTAL_ROUNDS })
    .withMessage(`total_rounds must be between 1 and ${MAX_TOTAL_ROUNDS}`),
  validate,
  controller.createMatch
);

router.put(
  '/:id',
  uuidParam,
  body('status')
    .isIn(Object.values(MATCH_STATUS))
    .withMessage('Invalid status value'),
  validate,
  controller.updateMatch
);

router.patch(
  '/:id/total-rounds',
  uuidParam,
  body('total_rounds')
    .isInt({ min: 1, max: MAX_TOTAL_ROUNDS })
    .withMessage(`total_rounds must be between 1 and ${MAX_TOTAL_ROUNDS}`),
  validate,
  controller.updateMatchTotalRounds
);

router.patch('/:id/resume', uuidParam, validate, controller.resumeMatch);

router.delete('/:id', uuidParam, validate, controller.deleteMatch);

module.exports = router;
