const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/groupController');
const { validate } = require('../middleware/validate');
const { requireGroup } = require('../middleware/requireGroup');

const router = express.Router();

// POST /api/v1/groups/create  – register a new group
router.post(
  '/create',
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('passcode')
    .isLength({ min: 4 })
    .withMessage('Passcode must be at least 4 characters'),
  validate,
  controller.createGroup
);

// POST /api/v1/groups/signin  – sign in to an existing group
router.post(
  '/signin',
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('passcode').notEmpty().withMessage('Passcode is required'),
  validate,
  controller.signIn
);

// POST /api/v1/groups/reset-passcode  – change the passcode (requires current passcode)
router.post(
  '/reset-passcode',
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('currentPasscode').notEmpty().withMessage('Current passcode is required'),
  body('newPasscode')
    .isLength({ min: 4 })
    .withMessage('New passcode must be at least 4 characters'),
  validate,
  controller.resetPasscode
);

// GET /api/v1/groups/me  – get current group info (protected)
router.get('/me', requireGroup, controller.getMe);

module.exports = router;
