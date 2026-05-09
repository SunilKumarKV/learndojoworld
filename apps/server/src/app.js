const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { limiter } = require('./config/rateLimit.config');
const corsOptions = require('./config/cors.config');
const { requestLogger } = require('./middlewares/requestLogger');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');
const adminReviewRoutes = require('./modules/adminReview/adminReview.routes');
const authRoutes = require('./modules/auth/auth.routes');
const creatorStudioRoutes = require('./modules/creatorStudio/creatorStudio.routes');
const doubtRoutes = require('./modules/doubts/doubt.routes');
const healthRoutes = require('./modules/health/health.routes');
const quizRoutes = require('./modules/quiz/quiz.routes');
const roadmapRoutes = require('./modules/roadmaps/roadmap.routes');
const studyTrackerRoutes = require('./modules/studyTracker/studyTracker.routes');
const topicRoutes = require('./modules/topics/topic.routes');
const flashcardRoutes = require('./modules/flashcards/flashcards.routes');

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

app.use('/api/v1/admin/review', adminReviewRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/creator-studio', creatorStudioRoutes);
app.use('/api/v1/doubts', doubtRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/study-tracker', studyTrackerRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/v1/flashcards', flashcardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
