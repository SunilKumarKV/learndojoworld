function parseAllowedOrigins() {
  const configuredOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

/**
 * Express CORS configuration for the API.
 */
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
