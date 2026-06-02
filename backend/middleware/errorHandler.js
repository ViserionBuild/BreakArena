const { sendError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // Supabase / Postgres errors
  if (err.code === '23505') {
    return sendError(res, 'Duplicate entry — resource already exists.', 409);
  }
  if (err.code === '23503') {
    return sendError(res, 'Referenced resource not found.', 404);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
};

module.exports = errorHandler;
