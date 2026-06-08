const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/playerController');
const { validate } = require('../middleware/validate');
const { requireGroup } = require('../middleware/requireGroup');

const router = express.Router();

// All player routes require group auth
router.use(requireGroup);

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
    .isString()
    .isLength({ max: 32 })
    .withMessage('Avatar must be a short string (emoji or URL)'),
  body('color')
    .optional({ nullable: true })
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a hex value like #fbbf24'),
];

router.get('/', controller.listPlayers);
router.get('/:id', uuidParam, validate, controller.getPlayer);
router.get('/:id/stats', uuidParam, validate, controller.getPlayerStats);
router.post('/', playerBody, validate, controller.createPlayer);
router.put('/:id', uuidParam, ...playerBody, validate, controller.updatePlayer);
router.delete('/:id', uuidParam, validate, controller.deletePlayer);
router.patch('/:id/reactivate', uuidParam, validate, controller.reactivatePlayer);

module.exports = router;

