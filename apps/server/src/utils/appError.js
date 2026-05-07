/**
 * Create an operational error that the global error handler can expose safely.
 * @param {string} message
 * @param {number} statusCode
 * @param {unknown} details
 * @returns {Error & { statusCode?: number, isOperational?: boolean, details?: unknown }}
 */
function createAppError(message, statusCode = 500, details = undefined) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  error.details = details;
  return error;
}

module.exports = { createAppError };
