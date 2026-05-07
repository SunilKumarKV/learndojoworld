import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import TopicBlock from '../components/topics/TopicBlock';
import { CONTENT_BLOCK_TYPE } from '../constants/contentBlockTypes';
import { useAuth } from '../features/auth/AuthContext';
import {
  addLessonNotes,
  fetchCreatorLesson,
  saveLessonQuiz,
  updateLesson,
} from '../features/creatorStudio/creatorStudioApi';

const contentBlockOptions = Object.values(CONTENT_BLOCK_TYPE);

const defaultNoteForm = {
  type: CONTENT_BLOCK_TYPE.PARAGRAPH,
  title: '',
  content: '',
  language: '',
};

const defaultQuestion = {
  prompt: '',
  type: 'MULTIPLE_CHOICE',
  optionsText: '',
  correctAnswer: '',
  explanation: '',
};

const defaultQuizForm = {
  title: '',
  instructions: '',
  questions: [defaultQuestion],
};

function formatBlockType(type) {
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getQuizForm(quiz) {
  if (!quiz) {
    return defaultQuizForm;
  }

  return {
    title: quiz.title,
    instructions: quiz.instructions || '',
    questions: quiz.questions.map((question) => ({
      prompt: question.prompt,
      type: question.type,
      optionsText: Array.isArray(question.options)
        ? question.options.join('\n')
        : '',
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
    })),
  };
}

function LessonEditor() {
  const { lessonId } = useParams();
  const { tokens } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    summary: '',
    videoUrl: '',
  });
  const [noteForm, setNoteForm] = useState(defaultNoteForm);
  const [quizForm, setQuizForm] = useState(defaultQuizForm);
  const [activeTab, setActiveTab] = useState('video');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadLesson() {
    const data = await fetchCreatorLesson(tokens.accessToken, lessonId);
    setLesson(data.lesson);
    setLessonForm({
      summary: data.lesson.summary || '',
      videoUrl: data.lesson.videoUrl || '',
    });
    setQuizForm(getQuizForm(data.lesson.quiz));
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchCreatorLesson(tokens.accessToken, lessonId);
        if (isMounted) {
          setLesson(data.lesson);
          setLessonForm({
            summary: data.lesson.summary || '',
            videoUrl: data.lesson.videoUrl || '',
          });
          setQuizForm(getQuizForm(data.lesson.quiz));
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load lesson'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [lessonId, tokens.accessToken]);

  function updateLessonForm(event) {
    const { name, value } = event.target;
    setLessonForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateNoteForm(event) {
    const { name, value } = event.target;
    setNoteForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateQuizField(event) {
    const { name, value } = event.target;
    setQuizForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function updateQuestion(index, event) {
    const { name, value } = event.target;
    setQuizForm((currentForm) => ({
      ...currentForm,
      questions: currentForm.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, [name]: value } : question
      ),
    }));
  }

  function addQuestion() {
    setQuizForm((currentForm) => ({
      ...currentForm,
      questions: [...currentForm.questions, defaultQuestion],
    }));
  }

  async function handleUpdateLesson(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateLesson(tokens.accessToken, lessonId, lessonForm);
      setSuccess('Lesson details saved.');
      await loadLesson();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to save lesson'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await addLessonNotes(tokens.accessToken, lessonId, [
        {
          ...noteForm,
          title: noteForm.title || undefined,
          language: noteForm.language || undefined,
        },
      ]);
      setNoteForm(defaultNoteForm);
      setSuccess('Note block added.');
      await loadLesson();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to add note');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveQuiz(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveLessonQuiz(tokens.accessToken, lessonId, {
        title: quizForm.title,
        instructions: quizForm.instructions,
        questions: quizForm.questions.map((question, index) => ({
          prompt: question.prompt,
          type: question.type,
          options: question.optionsText
            .split('\n')
            .map((option) => option.trim())
            .filter(Boolean),
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          order: index,
        })),
      });
      setSuccess('Quiz saved.');
      await loadLesson();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to save quiz');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CreatorStudioLayout title={lesson?.title || 'Lesson editor'}>
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading lesson editor...</p>
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

      {lesson ? (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                Lesson
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {lesson.title}
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                {lesson.videoUrl ? 'Video URL saved' : 'No video URL saved'} |{' '}
                {lesson.notes.length} note blocks |{' '}
                {lesson.quiz ? 'Quiz ready' : 'No quiz yet'}
              </p>
              {lesson.topicPage ? (
                <Link
                  to={`/topics/${lesson.topicPage.id}`}
                  className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Open topic page
                </Link>
              ) : null}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-950">Notes preview</h3>
              {lesson.notes.length ? (
                <div className="mt-4 space-y-4">
                  {lesson.notes.map((block) => (
                    <TopicBlock key={block.id} block={block} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  No note blocks yet.
                </p>
              )}
            </section>
          </aside>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
              {[
                ['video', 'Video and summary'],
                ['notes', 'Content blocks'],
                ['quiz', 'Quiz'],
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

            {activeTab === 'video' ? (
              <form onSubmit={handleUpdateLesson} className="grid gap-4 p-5">
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
                    className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Lesson outcome and learner promise."
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? 'Saving...' : 'Save lesson'}
                </button>
              </form>
            ) : null}

            {activeTab === 'notes' ? (
              <form onSubmit={handleAddNote} className="grid gap-4 p-5">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Block type
                  <select
                    name="type"
                    value={noteForm.type}
                    onChange={updateNoteForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    {contentBlockOptions.map((type) => (
                      <option key={type} value={type}>
                        {formatBlockType(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Block title
                  <input
                    name="title"
                    value={noteForm.title}
                    onChange={updateNoteForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Common mistake"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Language
                  <input
                    name="language"
                    value={noteForm.language}
                    onChange={updateNoteForm}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="javascript"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Content
                  <textarea
                    name="content"
                    value={noteForm.content}
                    onChange={updateNoteForm}
                    className="min-h-40 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Write the note, example, warning, or code block."
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSaving ? 'Adding...' : 'Add block'}
                </button>
              </form>
            ) : null}

            {activeTab === 'quiz' ? (
              <form onSubmit={handleSaveQuiz} className="grid gap-4 p-5">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Quiz title
                  <input
                    name="title"
                    value={quizForm.title}
                    onChange={updateQuizField}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="HTML basics checkpoint"
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Instructions
                  <textarea
                    name="instructions"
                    value={quizForm.instructions}
                    onChange={updateQuizField}
                    className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Short quiz prompt."
                  />
                </label>

                <div className="space-y-4">
                  {quizForm.questions.map((question, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="grid gap-4">
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Question
                          <input
                            name="prompt"
                            value={question.prompt}
                            onChange={(event) => updateQuestion(index, event)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Which tag creates a heading?"
                            required
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Options
                          <textarea
                            name="optionsText"
                            value={question.optionsText}
                            onChange={(event) => updateQuestion(index, event)}
                            className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="<h1>&#10;<p>&#10;<a>"
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Correct answer
                          <input
                            name="correctAnswer"
                            value={question.correctAnswer}
                            onChange={(event) => updateQuestion(index, event)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="<h1>"
                            required
                          />
                        </label>
                        <label className="grid gap-2 text-sm font-semibold text-slate-700">
                          Explanation
                          <textarea
                            name="explanation"
                            value={question.explanation}
                            onChange={(event) => updateQuestion(index, event)}
                            className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Explain why the answer is correct."
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Add question
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSaving ? 'Saving...' : 'Save quiz'}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </CreatorStudioLayout>
  );
}

export default LessonEditor;
