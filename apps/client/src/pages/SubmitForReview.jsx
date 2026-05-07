import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';
import {
  fetchCreatorCourses,
  submitCourseForReview,
} from '../features/creatorStudio/creatorStudioApi';

function SubmitForReview() {
  const { tokens } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        const data = await fetchCreatorCourses(tokens.accessToken);
        if (isMounted) {
          setCourses(data.courses);
          setSelectedCourseId((currentId) => currentId || data.courses[0]?.id);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load courses'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const data = await submitCourseForReview(
        tokens.accessToken,
        selectedCourseId
      );
      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course.id === data.course.id ? data.course : course
        )
      );
      setSuccess('Course submitted for admin review.');
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          'Unable to submit course for review'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CreatorStudioLayout title="Submit for review">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading review queue...</p>
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

      {!isLoading && !courses.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            No courses to review
          </h2>
          <Link
            to="/creator/courses/new"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Create course
          </Link>
        </section>
      ) : null}

      {courses.length ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Course
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedCourse ? (
              <div className="mt-5 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">
                    {selectedCourse.title}
                  </h2>
                  <StatusBadge status={selectedCourse.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-500">Modules</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {selectedCourse.moduleCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Lessons</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {selectedCourse.lessonCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Notes</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {selectedCourse.noteBlockCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Quizzes</dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {selectedCourse.quizCount}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Review readiness
            </h2>
            {selectedCourse ? (
              <div className="mt-5 grid gap-3">
                {[
                  ['Course shell', Boolean(selectedCourse.title)],
                  ['At least one module', selectedCourse.moduleCount > 0],
                  ['At least one lesson', selectedCourse.lessonCount > 0],
                  [
                    'Video, notes, or quiz',
                    selectedCourse.videoLessonCount > 0 ||
                      selectedCourse.noteBlockCount > 0 ||
                      selectedCourse.quizCount > 0,
                  ],
                ].map(([label, isReady]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-md border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        isReady
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {isReady ? 'Ready' : 'Needed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {selectedCourse ? (
                <Link
                  to={`/creator/courses/${selectedCourse.id}/builder`}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Open builder
                </Link>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || !selectedCourseId}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit course'}
              </button>
            </div>
          </section>
        </form>
      ) : null}
    </CreatorStudioLayout>
  );
}

export default SubmitForReview;
