const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/playerController');
const { validate } = require('../middleware/validate');

const router = express.Router();

const uuidParam = param('id').isUUID().withMessage('Invalid player ID');

const playerBody = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 80 })
    .withMessage('Name max 80 characters'),
  body('avatar')
    .optional({ nullable: true })
    .isURL()
    .withMessage('Avatar must be a valid URL'),
];

// GET /players
router.get('/', controller.listPlayers);

// GET /players/:id
router.get('/:id', uuidParam, validate, controller.getPlayer);

// GET /players/:id/stats
router.get('/:id/stats', uuidParam, validate, controller.getPlayerStats);

// POST /players
router.post('/', playerBody, validate, controller.createPlayer);

// PUT /players/:id
router.put('/:id', uuidParam, ...playerBody, validate, controller.updatePlayer);

// DELETE /players/:id
router.delete('/:id', uuidParam, validate, controller.deletePlayer);

module.exports = router;
