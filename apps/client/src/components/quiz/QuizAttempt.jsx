import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QUIZ_QUESTION_TYPE } from '../quiz/quizConstants';

function QuizAttempt({
  quiz,
  onAnswerSubmitted,
  onQuizSubmitted,
  isLoading = false,
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [startTime] = useState(Date.now());

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleAnswerChange = (answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  const handleNextQuestion = async () => {
    const answer = selectedAnswers[currentQuestion.id];
    if (!answer) {
      alert('Please select an answer');
      return;
    }

    // Submit answer to backend
    await onAnswerSubmitted({
      questionId: currentQuestion.id,
      selectedAnswer: answer,
    });

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (
      Object.keys(selectedAnswers).length !== totalQuestions
    ) {
      alert('Please answer all questions');
      return;
    }

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    await onQuizSubmitted(timeTaken);
  };

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Quiz Header */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </p>
        <div className="mt-4 h-2 bg-slate-200 rounded-full">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Instructions */}
      {quiz.instructions && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          {quiz.instructions}
        </div>
      )}

      {/* Question Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {currentQuestion.prompt}
        </h2>

        <div className="mt-6 space-y-3">
          {currentQuestion.type === QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE && (
            <>
              {currentQuestion.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-center rounded-md border border-slate-300 p-3 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={selectedAnswers[currentQuestion.id] === option}
                    onChange={() => handleAnswerChange(option)}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 text-slate-900">{option}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.type === QUIZ_QUESTION_TYPE.TRUE_FALSE && (
            <>
              {['True', 'False'].map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center rounded-md border border-slate-300 p-3 hover:bg-slate-50"
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={selectedAnswers[currentQuestion.id] === option}
                    onChange={() => handleAnswerChange(option)}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 text-slate-900">{option}</span>
                </label>
              ))}
            </>
          )}

          {currentQuestion.type === QUIZ_QUESTION_TYPE.FILL_BLANK && (
            <input
              type="text"
              value={selectedAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 || isLoading}
          className="flex-1 rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNextQuestion}
            disabled={isLoading}
            className="flex-1 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            disabled={isLoading}
            className="flex-1 rounded-md bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Submit Quiz
          </button>
        )}
      </div>

      {/* Question Summary */}
      <div className="rounded-lg bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          Questions Summary
        </p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`h-10 w-10 rounded-md text-sm font-semibold ${
                selectedAnswers[q.id]
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-slate-200 text-slate-700'
              } ${
                index === currentQuestionIndex
                  ? 'ring-2 ring-offset-2 ring-emerald-600'
                  : ''
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuizAttempt;
