const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/matchController');
const { validate } = require('../middleware/validate');
const { MATCH_STATUS, PLAYERS_PER_MATCH } = require('../config/constants');

const router = express.Router();

const uuidParam = param('id').isUUID().withMessage('Invalid match ID');

// GET /matches
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

// GET /matches/:id
router.get('/:id', uuidParam, validate, controller.getMatch);

// POST /matches
router.post(
  '/',
  body('player_ids')
    .isArray({ min: PLAYERS_PER_MATCH, max: PLAYERS_PER_MATCH })
    .withMessage(`Exactly ${PLAYERS_PER_MATCH} player IDs required`),
  body('player_ids.*').isUUID().withMessage('Each player ID must be a valid UUID'),
  validate,
  controller.createMatch
);

// PUT /matches/:id
router.put(
  '/:id',
  uuidParam,
  body('status')
    .isIn(Object.values(MATCH_STATUS))
    .withMessage('Invalid status value'),
  validate,
  controller.updateMatch
);

// DELETE /matches/:id
router.delete('/:id', uuidParam, validate, controller.deleteMatch);

module.exports = router;
