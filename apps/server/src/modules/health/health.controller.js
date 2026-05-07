const { successResponse } = require('../../utils/apiResponse');

/**
 * Health check controller returns uptime and service metadata.
 */
function getHealthStatus(req, res) {
  return successResponse(
    res,
    {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    'Service healthy'
  );
}

module.exports = { getHealthStatus };
