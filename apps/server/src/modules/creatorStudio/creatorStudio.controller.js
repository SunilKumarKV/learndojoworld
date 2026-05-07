const { successResponse } = require('../../utils/apiResponse');
const {
  addLessonNotes,
  createCourseModule,
  createCreatorCourse,
  createCreatorTopic,
  createLesson,
  getCreatorCourse,
  getCreatorDashboard,
  getCreatorLesson,
  listCreatorCourses,
  submitCourseForReview,
  updateLesson,
  upsertLessonQuiz,
} = require('./creatorStudio.service');

async function getDashboard(req, res) {
  const dashboard = await getCreatorDashboard(req.user);
  return successResponse(res, dashboard, 'Creator dashboard retrieved');
}

async function getCourses(req, res) {
  const courses = await listCreatorCourses(req.user);
  return successResponse(res, { courses }, 'Creator courses retrieved');
}

async function getCourseDetail(req, res) {
  const course = await getCreatorCourse(req.user, req.params.courseId);
  return successResponse(res, { course }, 'Creator course retrieved');
}

async function getLessonDetail(req, res) {
  const lesson = await getCreatorLesson(req.user, req.params.lessonId);
  return successResponse(res, { lesson }, 'Creator lesson retrieved');
}

async function postCourse(req, res) {
  const course = await createCreatorCourse(req.user, req.body);
  return successResponse(res, { course }, 'Course created', 201);
}

async function postModule(req, res) {
  const courseModule = await createCourseModule(
    req.user,
    req.params.courseId,
    req.body
  );
  return successResponse(res, { module: courseModule }, 'Module created', 201);
}

async function postLesson(req, res) {
  const lesson = await createLesson(req.user, req.params.moduleId, req.body);
  return successResponse(res, { lesson }, 'Lesson created', 201);
}

async function patchLesson(req, res) {
  const lesson = await updateLesson(req.user, req.params.lessonId, req.body);
  return successResponse(res, { lesson }, 'Lesson updated');
}

async function postLessonNotes(req, res) {
  const blocks = await addLessonNotes(
    req.user,
    req.params.lessonId,
    req.body.blocks
  );
  return successResponse(res, { blocks }, 'Lesson notes added', 201);
}

async function postLessonQuiz(req, res) {
  const quiz = await upsertLessonQuiz(req.user, req.params.lessonId, req.body);
  return successResponse(res, { quiz }, 'Lesson quiz saved');
}

async function postCourseReview(req, res) {
  const course = await submitCourseForReview(req.user, req.params.courseId);
  return successResponse(res, { course }, 'Course submitted for review');
}

async function postCreatorTopic(req, res) {
  const topic = await createCreatorTopic(req.user, req.body);
  return successResponse(res, { topic }, 'Topic page created', 201);
}

module.exports = {
  getDashboard,
  getCourses,
  getCourseDetail,
  getLessonDetail,
  postCourse,
  postModule,
  postLesson,
  patchLesson,
  postLessonNotes,
  postLessonQuiz,
  postCourseReview,
  postCreatorTopic,
};
