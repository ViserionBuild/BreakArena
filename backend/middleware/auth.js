const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Middleware: Require a valid JWT Bearer token.
 * Attach decoded payload to req.user.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorised — no token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return sendError(res, 'Unauthorised — invalid or expired token', 401);
  }
};

/**
 * Middleware: Attach user info if token is present but don't block.
 * Useful for guest-compatible endpoints.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // silently ignore invalid token for optional auth
    }
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
