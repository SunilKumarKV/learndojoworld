import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';
import { fetchCreatorCourses } from '../features/creatorStudio/creatorStudioApi';

function CreatorCourses() {
  const { tokens } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      try {
        const data = await fetchCreatorCourses(tokens.accessToken);
        if (isMounted) {
          setCourses(data.courses);
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

  return (
    <CreatorStudioLayout
      title="My courses"
      actions={
        <Link
          to="/creator/courses/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          New course
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading courses...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !courses.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Build your first course
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Create a course shell, split it into modules, then add lessons,
            notes, topic pages, and quizzes before review.
          </p>
          <Link
            to="/creator/courses/new"
            className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Open course builder
          </Link>
        </section>
      ) : null}

      {courses.length ? (
        <div className="grid gap-4">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950">
                      {course.title}
                    </h2>
                    <StatusBadge status={course.status} />
                  </div>
                  {course.subtitle || course.description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {course.subtitle || course.description}
                    </p>
                  ) : null}
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-slate-500">Modules</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {course.moduleCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Lessons</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {course.lessonCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Quizzes</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {course.quizCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Notes</dt>
                      <dd className="mt-1 font-semibold text-slate-950">
                        {course.noteBlockCount}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/creator/courses/${course.id}/builder`}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Builder
                  </Link>
                  <Link
                    to={`/creator/submit-review?courseId=${course.id}`}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Review
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </CreatorStudioLayout>
  );
}

export default CreatorCourses;
