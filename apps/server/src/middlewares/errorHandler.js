/**
 * Global 404 handler for unknown routes.
 */
function notFoundHandler(req, res, next) {
  const error = new Error('Route not found');
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
}

/**
 * Express error middleware that normalizes all API errors.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    status: 'error',
    message: err.isOperational ? err.message : 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  if (err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

module.exports = { notFoundHandler, errorHandler };
