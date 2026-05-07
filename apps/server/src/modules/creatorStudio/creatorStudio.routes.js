const express = require('express');
const { authenticate, authorizeRoles } = require('../../middlewares/auth');
const { validateRequest } = require('../../middlewares/validateRequest');
const { ROLES } = require('../auth/auth.constants');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getCourseDetail,
  getCourses,
  getDashboard,
  getLessonDetail,
  patchLesson,
  postCourse,
  postCourseReview,
  postCreatorTopic,
  postLesson,
  postLessonNotes,
  postLessonQuiz,
  postModule,
} = require('./creatorStudio.controller');
const {
  addLessonNotesSchema,
  courseParamsSchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  createStudioTopicSchema,
  lessonParamsSchema,
  moduleParamsSchema,
  updateLessonSchema,
  upsertQuizSchema,
} = require('./creatorStudio.validation');

const router = express.Router();
const canUseCreatorStudio = authorizeRoles(ROLES.ADMIN, ROLES.CREATOR);

router.use(authenticate);
router.use(canUseCreatorStudio);

router.get('/dashboard', asyncHandler(getDashboard));
router.get('/courses', asyncHandler(getCourses));
router.post(
  '/courses',
  validateRequest(createCourseSchema),
  asyncHandler(postCourse)
);
router.get(
  '/courses/:courseId',
  validateRequest(courseParamsSchema, 'params'),
  asyncHandler(getCourseDetail)
);
router.post(
  '/courses/:courseId/modules',
  validateRequest(courseParamsSchema, 'params'),
  validateRequest(createModuleSchema),
  asyncHandler(postModule)
);
router.post(
  '/courses/:courseId/submit-review',
  validateRequest(courseParamsSchema, 'params'),
  asyncHandler(postCourseReview)
);
router.post(
  '/modules/:moduleId/lessons',
  validateRequest(moduleParamsSchema, 'params'),
  validateRequest(createLessonSchema),
  asyncHandler(postLesson)
);
router.get(
  '/lessons/:lessonId',
  validateRequest(lessonParamsSchema, 'params'),
  asyncHandler(getLessonDetail)
);
router.patch(
  '/lessons/:lessonId',
  validateRequest(lessonParamsSchema, 'params'),
  validateRequest(updateLessonSchema),
  asyncHandler(patchLesson)
);
router.post(
  '/lessons/:lessonId/notes',
  validateRequest(lessonParamsSchema, 'params'),
  validateRequest(addLessonNotesSchema),
  asyncHandler(postLessonNotes)
);
router.post(
  '/lessons/:lessonId/quiz',
  validateRequest(lessonParamsSchema, 'params'),
  validateRequest(upsertQuizSchema),
  asyncHandler(postLessonQuiz)
);
router.post(
  '/topics',
  validateRequest(createStudioTopicSchema),
  asyncHandler(postCreatorTopic)
);

module.exports = router;
