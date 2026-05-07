import { useState } from 'react';

function QuizResult({ attempt, quiz }) {
  const [expandedAnswers, setExpandedAnswers] = useState([]);

  if (!attempt) {
    return <div>Loading...</div>;
  }

  const { score, correctCount, totalQuestions, isPassed, answers } = attempt;
  const passing Score = quiz.passingScore || 70;

  const wrongAnswers = answers.filter((a) => !a.isCorrect);
  const correctAnswers = answers.filter((a) => a.isCorrect);

  const toggleAnswerExpand = (index) => {
    setExpandedAnswers((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
      );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Result Summary */}
      <div
        className={`rounded-lg p-6 shadow-sm ${
          isPassed
            ? 'border border-emerald-200 bg-emerald-50'
            : 'border border-red-200 bg-red-50'
        }`}
      >
        <div className="text-center">
          <div className="text-5xl font-bold text-slate-900">{score}%</div>
          <p
            className={`mt-2 text-lg font-semibold ${
              isPassed ? 'text-emerald-900' : 'text-red-900'
            }`}
          >
            {isPassed ? '✓ Quiz Passed' : '✗ Quiz Not Passed'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            You got {correctCount} out of {totalQuestions} questions correct
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Passing score: {passingScore}%
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 h-4 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              isPassed ? 'bg-emerald-600' : 'bg-red-600'
            } transition-all`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {correctCount}
          </div>
          <p className="mt-1 text-sm text-slate-600">Correct</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {wrongAnswers.length}
          </div>
          <p className="mt-1 text-sm text-slate-600">Incorrect</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">
            {totalQuestions}
          </div>
          <p className="mt-1 text-sm text-slate-600">Total</p>
        </div>
      </div>

      {/* Correct Answers */}
      {correctAnswers.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="text-lg font-semibold text-emerald-900">
            ✓ Correct Answers ({correctAnswers.length})
          </h3>
          <div className="mt-4 space-y-3">
            {correctAnswers.map((answer, index) => (
              <div
                key={answer.id}
                className="rounded-md border border-emerald-200 bg-white p-3"
              >
                <p className="font-semibold text-slate-900">
                  {answer.prompt}
                </p>
                <p className="mt-1 text-sm text-emerald-700">
                  Your answer: {answer.selectedAnswer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wrong Answers with Review */}
      {wrongAnswers.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">
            ✗ Review Wrong Answers ({wrongAnswers.length})
          </h3>
          <div className="mt-4 space-y-3">
            {wrongAnswers.map((answer, index) => (
              <button
                key={answer.id}
                onClick={() => toggleAnswerExpand(index)}
                className="w-full text-left"
              >
                <div className="rounded-md border border-red-200 bg-white p-3 hover:bg-red-50">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-slate-900">
                      {answer.prompt}
                    </p>
                    <svg
                      className={`h-5 w-5 text-red-600 transform transition-transform ${
                        expandedAnswers.includes(index) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </div>

                  {expandedAnswers.includes(index) && (
                    <div className="mt-3 space-y-2 border-t border-red-200 pt-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Your Answer
                        </p>
                        <p className="text-sm text-red-700">
                          {answer.selectedAnswer}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">
                          Correct Answer
                        </p>
                        <p className="text-sm text-emerald-700">
                          {answer.correctAnswer}
                        </p>
                      </div>
                      {answer.explanation && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Explanation
                          </p>
                          <p className="text-sm text-slate-700">
                            {answer.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attempt Time Info */}
      {attempt.timeTakenSeconds && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
          Time taken: {Math.floor(attempt.timeTakenSeconds / 60)} minutes{' '}
          {attempt.timeTakenSeconds % 60} seconds
        </div>
      )}

      {/* Footer Message */}
      <div className="rounded-lg bg-slate-50 p-4 text-center">
        {isPassed ? (
          <p className="text-sm text-emerald-700">
            Great job! You passed the quiz. Continue to the next section.
          </p>
        ) : (
          <p className="text-sm text-red-700">
            You didn't meet the passing score. Review the material and try again.
          </p>
        )}
      </div>
    </div>
  );
}

export default QuizResult;
