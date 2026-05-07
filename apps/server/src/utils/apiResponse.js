/**
 * Standard API response helpers for controller responses.
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

function errorResponse(res, message, statusCode = 500, details = undefined) {
  return res.status(statusCode).json({
    status: 'error',
    message,
    details,
  });
}

module.exports = { successResponse, errorResponse };
