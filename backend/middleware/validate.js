const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Run after express-validator chains.
 * If any validation errors exist, respond 422 with details.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 422, errors.array());
  }
  next();
};

module.exports = { validate };
