const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { limiter } = require('./config/rateLimit.config');
const corsOptions = require('./config/cors.config');
const { requestLogger } = require('./middlewares/requestLogger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const healthRoutes = require('./modules/health/health.routes');

/**
 * Create the Express application instance with global middleware.
 * @returns {import('express').Application}
 */
const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);
app.use(requestLogger);

app.use('/api/v1/health', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
