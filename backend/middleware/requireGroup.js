const groupService = require('../services/groupService');
const { sendError } = require('../utils/response');

/**
 * Middleware that reads the Bearer token from the Authorization header,
 * verifies it, and attaches groupId + groupName to req.
 */
const requireGroup = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, 'Authentication required – please sign in to your group', 401);
  }

  try {
    const payload = groupService.verifyToken(token);
    req.groupId   = payload.groupId;
    req.groupName = payload.groupName;
    next();
  } catch (err) {
    sendError(res, err.message, err.statusCode || 401);
  }
};

module.exports = { requireGroup };
