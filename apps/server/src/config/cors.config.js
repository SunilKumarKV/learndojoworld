const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];

/**
 * Express CORS configuration for the API.
 */
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
