import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QUIZ_QUESTION_TYPE, QUIZ_QUESTION_LABELS } from '../quiz/quizConstants';

const questionSchema = z.object({
  prompt: z.string().trim().min(3, 'Question is required'),
  type: z.enum(Object.values(QUIZ_QUESTION_TYPE)),
  options: z.array(z.string().trim().min(1)).optional(),
  correctAnswer: z.string().trim().min(1, 'Correct answer is required'),
  explanation: z.string().trim().optional(),
});

const quizBuilderSchema = z.object({
  title: z.string().trim().min(3, 'Title is required'),
  instructions: z.string().trim().optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  questions: z.array(questionSchema).min(1, 'Add at least one question'),
});

function QuizBuilder({ initialData, onSubmit, isLoading = false }) {
  const [expandedQuestion, setExpandedQuestion] = useState(0);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm({
    resolver: zodResolver(quizBuilderSchema),
    defaultValues: initialData || {
      title: '',
      instructions: '',
      passingScore: 70,
      questions: [
        {
          prompt: '',
          type: QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE,
          options: ['', ''],
          correctAnswer: '',
          explanation: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const questions = watch('questions');

  const handleAddQuestion = () => {
    append({
      prompt: '',
      type: QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE,
      options: ['', ''],
      correctAnswer: '',
      explanation: '',
    });
    setExpandedQuestion(fields.length);
  };

  const handleQuestionTypeChange = (index, newType) => {
    const question = questions[index];
    if (newType === QUIZ_QUESTION_TYPE.TRUE_FALSE) {
      question.options = ['True', 'False'];
    } else if (newType === QUIZ_QUESTION_TYPE.FILL_BLANK) {
      question.options = undefined;
    } else {
      question.options = question.options || ['', ''];
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title and Instructions */}
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Quiz Title
          </label>
          <input
            {...register('title')}
            type="text"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Enter quiz title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Instructions (Optional)
          </label>
          <textarea
            {...register('instructions')}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Enter instructions for learners"
            rows="3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Passing Score (%)
          </label>
          <input
            {...register('passingScore', { valueAsNumber: true })}
            type="number"
            min="0"
            max="100"
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          {errors.passingScore && (
            <p className="mt-1 text-sm text-red-600">
              {errors.passingScore.message}
            </p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Questions</h3>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === index ? -1 : index
                )
              }
              className="w-full px-6 py-4 text-left font-semibold text-slate-900 hover:bg-slate-50"
            >
              <div className="flex items-center justify-between">
                <span>
                  Question {index + 1}:{' '}
                  {watch(`questions.${index}.prompt`) ||
                    'Click to edit'}
                </span>
                <svg
                  className={`h-5 w-5 transform transition-transform ${
                    expandedQuestion === index
                      ? 'rotate-180'
                      : ''
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
            </button>

            {expandedQuestion === index && (
              <div className="space-y-4 border-t border-slate-200 px-6 py-4">
                {/* Question Prompt */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Question
                  </label>
                  <textarea
                    {...register(`questions.${index}.prompt`)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Enter question"
                    rows="2"
                  />
                  {errors.questions?.[index]?.prompt && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.questions[index].prompt.message}
                    </p>
                  )}
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Question Type
                  </label>
                  <select
                    {...register(`questions.${index}.type`)}
                    onChange={(e) =>
                      handleQuestionTypeChange(index, e.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    {Object.entries(QUIZ_QUESTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Options */}
                {questions[index].type !== QUIZ_QUESTION_TYPE.FILL_BLANK && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      Options
                    </label>
                    <div className="mt-2 space-y-2">
                      {questions[index].options?.map((_, optionIndex) => (
                        <input
                          key={optionIndex}
                          {...register(
                            `questions.${index}.options.${optionIndex}`
                          )}
                          type="text"
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                          placeholder={`Option ${optionIndex + 1}`}
                          disabled={
                            questions[index].type ===
                            QUIZ_QUESTION_TYPE.TRUE_FALSE
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Correct Answer
                  </label>
                  {questions[index].type ===
                  QUIZ_QUESTION_TYPE.MULTIPLE_CHOICE ? (
                    <select
                      {...register(`questions.${index}.correctAnswer`)}
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">Select correct answer</option>
                      {questions[index].options?.map((option, optionIndex) => (
                        <option key={optionIndex} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register(`questions.${index}.correctAnswer`)}
                      type="text"
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      placeholder="Enter correct answer"
                    />
                  )}
                  {errors.questions?.[index]?.correctAnswer && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.questions[index].correctAnswer.message}
                    </p>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Explanation (Optional)
                  </label>
                  <textarea
                    {...register(`questions.${index}.explanation`)}
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Explain why this is correct"
                    rows="2"
                  />
                </div>

                {/* Delete Button */}
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Delete Question
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {errors.questions && (
          <p className="text-sm text-red-600">{errors.questions.message}</p>
        )}
      </div>

      {/* Add Question Button */}
      <button
        type="button"
        onClick={handleAddQuestion}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        + Add Question
      </button>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating Quiz...' : 'Create Quiz'}
      </button>
    </form>
  );
}

export default QuizBuilder;
