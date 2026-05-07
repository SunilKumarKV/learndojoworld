/**
 * Wrap an async Express handler and forward rejections to the error middleware.
 * @param {import('express').RequestHandler} handler
 */
function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
