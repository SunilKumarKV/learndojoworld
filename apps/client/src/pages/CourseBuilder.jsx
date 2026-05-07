import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';
import {
  createCourseModule,
  createCreatorCourse,
  createLesson,
  fetchCreatorCourse,
} from '../features/creatorStudio/creatorStudioApi';

const defaultCourseForm = {
  title: '',
  subtitle: '',
  description: '',
  level: '',
};

const defaultModuleForm = {
  title: '',
  summary: '',
};

const defaultLessonForm = {
  moduleId: '',
  title: '',
  summary: '',
  videoUrl: '',
};

function CourseBuilder() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('outline');
  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [moduleForm, setModuleForm] = useState(defaultModuleForm);
  const [lessonForm, setLessonForm] = useState(defaultLessonForm);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const modules = useMemo(() => course?.modules || [], [course]);

  async function loadCourse() {
    if (!courseId) {
      return;
    }

    const data = await fetchCreatorCourse(tokens.accessToken, courseId);
    setCourse(data.course);
    setLessonForm((currentForm) => ({
      ...currentForm,
      moduleId: currentForm.moduleId || data.course.modules[0]?.id || '',
    }));
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchCreatorCourse(tokens.accessToken, courseId);
        if (isMounted) {
          setCourse(data.course);
          setLessonForm((currentForm) => ({
            ...currentForm,
            moduleId: currentForm.moduleId || data.course.modules[0]?.id || '',
          }));
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load course'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (courseId) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [courseId, tokens.accessToken]);

  function updateCourseForm(event) {
    const { name, value } = event.target;
    setCourseForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateModuleForm(event) {
    const { name, value } = event.target;
    setModuleForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateLessonForm(event) {
    const { name, value } = event.target;
    setLessonForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleCreateCourse(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await createCreatorCourse(tokens.accessToken, courseForm);
      setSuccess('Course shell created. Add modules and lessons next.');
      navigate(`/creator/courses/${data.course.id}/builder`, { replace: true });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to create course'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateModule(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await createCourseModule(tokens.accessToken, course.id, moduleForm);
      setModuleForm(defaultModuleForm);
      setSuccess('Module added to the course.');
      await loadCourse();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to add module');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateLesson(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await createLesson(tokens.accessToken, lessonForm.moduleId, {
        title: lessonForm.title,
        summary: lessonForm.summary,
        videoUrl: lessonForm.videoUrl,
      });
      setLessonForm((currentForm) => ({
        ...defaultLessonForm,
        moduleId: currentForm.moduleId,
      }));
      setSuccess('Lesson created. Open it to add notes and a quiz.');
      await loadCourse();
      navigate(`/creator/lessons/${data.lesson.id}`);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to add lesson');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CreatorStudioLayout title={course?.title || 'Course builder'}>
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading course builder...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {!courseId ? (
        <form
          onSubmit={handleCreateCourse}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              New course
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Course shell
            </h2>
          </div>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Course title
              <input
                name="title"
                value={courseForm.title}
                onChange={updateCourseForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Full-stack JavaScript Foundations"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Subtitle
              <input
                name="subtitle"
                value={courseForm.subtitle}
                onChange={updateCourseForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="A practical path from HTML to APIs"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Description
              <textarea
                name="description"
                value={courseForm.description}
                onChange={updateCourseForm}
                className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="What learners will build, practice, and understand."
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Level
              <input
                name="level"
                value={courseForm.level}
                onChange={updateCourseForm}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Beginner"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="mt-6 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? 'Creating...' : 'Create course'}
          </button>
        </form>
      ) : null}

      {course ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-950">
                    {course.title}
                  </h2>
                  <StatusBadge status={course.status} />
                </div>
                {course.subtitle || course.description ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {course.subtitle || course.description}
                  </p>
                ) : null}
              </div>
              <Link
                to={`/creator/submit-review?courseId=${course.id}`}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                Submit for review
              </Link>
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">Modules</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">
                  {course.moduleCount}
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">Lessons</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">
                  {course.lessonCount}
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">Notes</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">
                  {course.noteBlockCount}
                </dd>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <dt className="font-medium text-slate-500">Quizzes</dt>
                <dd className="mt-1 text-lg font-bold text-slate-950">
                  {course.quizCount}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
              {[
                ['outline', 'Course outline'],
                ['modules', 'Add module'],
                ['lessons', 'Add lesson'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    activeTab === key
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'outline' ? (
              <div className="p-5">
                {!modules.length ? (
                  <p className="text-sm text-slate-600">
                    Add your first module to start shaping the course outline.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((courseModule) => (
                      <div
                        key={courseModule.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <h3 className="font-semibold text-slate-950">
                          {courseModule.title}
                        </h3>
                        {courseModule.summary ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {courseModule.summary}
                          </p>
                        ) : null}
                        <div className="mt-4 grid gap-3">
                          {courseModule.lessons.length ? (
                            courseModule.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div>
                                  <p className="font-medium text-slate-950">
                                    {lesson.title}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {lesson.videoUrl
                                      ? 'Video added'
                                      : 'No video URL yet'}{' '}
                                    | {lesson.notes.length} note blocks |{' '}
                                    {lesson.quiz ? 'Quiz added' : 'No quiz yet'}
                                  </p>
                                </div>
                                <Link
                                  to={`/creator/lessons/${lesson.id}`}
                                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-white"
                                >
                                  Edit lesson
                                </Link>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                              No lessons in this module yet.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === 'modules' ? (
              <form onSubmit={handleCreateModule} className="grid gap-4 p-5">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Module title
                  <input
                    name="title"
                    value={moduleForm.title}
                    onChange={updateModuleForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="HTML fundamentals"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Summary
                  <textarea
                    name="summary"
                    value={moduleForm.summary}
                    onChange={updateModuleForm}
                    className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="What learners should understand after this module."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? 'Adding...' : 'Add module'}
                </button>
              </form>
            ) : null}

            {activeTab === 'lessons' ? (
              <form onSubmit={handleCreateLesson} className="grid gap-4 p-5">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Module
                  <select
                    name="moduleId"
                    value={lessonForm.moduleId}
                    onChange={updateLessonForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    required
                  >
                    <option value="">Select module</option>
                    {modules.map((courseModule) => (
                      <option key={courseModule.id} value={courseModule.id}>
                        {courseModule.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Lesson title
                  <input
                    name="title"
                    value={lessonForm.title}
                    onChange={updateLessonForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Build your first semantic page"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Video URL
                  <input
                    name="videoUrl"
                    value={lessonForm.videoUrl}
                    onChange={updateLessonForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Summary
                  <textarea
                    name="summary"
                    value={lessonForm.summary}
                    onChange={updateLessonForm}
                    className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="The outcome of this lesson."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSaving || !modules.length}
                  className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? 'Adding...' : 'Add lesson'}
                </button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </CreatorStudioLayout>
  );
}

export default CourseBuilder;
