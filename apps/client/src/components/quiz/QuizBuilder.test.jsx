// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import QuizBuilder from './QuizBuilder';
import QuizAttempt from './QuizAttempt';
import QuizResult from './QuizResult';

afterEach(() => {
  cleanup();
});

const mockQuiz = {
  id: 'quiz_1',
  title: 'HTML Basics',
  instructions: 'Answer all questions',
  passingScore: 70,
  questionCount: 2,
  questions: [
    {
      id: 'q1',
      prompt: 'What does HTML stand for?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Hyper Text Markup Language',
        'Home Tool Markup Language',
      ],
      order: 0,
    },
    {
      id: 'q2',
      prompt: 'Is HTML a programming language?',
      type: 'TRUE_FALSE',
      options: ['True', 'False'],
      order: 1,
    },
  ],
};

const mockAttempt = {
  id: 'attempt_1',
  score: 100,
  correctCount: 2,
  totalQuestions: 2,
  isPassed: true,
  timeTakenSeconds: 300,
  answers: [
    {
      id: 'a1',
      questionId: 'q1',
      prompt: 'What does HTML stand for?',
      selectedAnswer: 'Hyper Text Markup Language',
      correctAnswer: 'Hyper Text Markup Language',
      isCorrect: true,
      explanation: 'HTML stands for Hyper Text Markup Language',
      type: 'MULTIPLE_CHOICE',
    },
    {
      id: 'a2',
      questionId: 'q2',
      prompt: 'Is HTML a programming language?',
      selectedAnswer: 'False',
      correctAnswer: 'False',
      isCorrect: true,
      explanation: 'HTML is a markup language',
      type: 'TRUE_FALSE',
    },
  ],
};

describe('Quiz Components', () => {
  describe('QuizBuilder', () => {
    it('renders quiz builder with default values', () => {
      const mockOnSubmit = vi.fn();
      render(
        <QuizBuilder onSubmit={mockOnSubmit} />
      );

      expect(screen.getByPlaceholderText('Enter quiz title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter instructions for learners')).toBeInTheDocument();
      expect(screen.getByText(/Add Question/i)).toBeInTheDocument();
    });

    it('allows adding questions', () => {
      const mockOnSubmit = vi.fn();
      render(
        <QuizBuilder onSubmit={mockOnSubmit} />
      );

      const addButton = screen.getByText(/Add Question/i);
      fireEvent.click(addButton);

      // Should now have 2 questions
      expect(screen.getByText(/Question 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Question 2/i)).toBeInTheDocument();
    });

    it('allows expanding/collapsing questions', () => {
      const mockOnSubmit = vi.fn();
      render(
        <QuizBuilder onSubmit={mockOnSubmit} />
      );

      const questionButton = screen.getByText(/Question 1/i);
      fireEvent.click(questionButton);

      expect(screen.getByPlaceholderText('Enter question')).toBeInTheDocument();
    });
  });

  describe('QuizAttempt', () => {
    it('renders quiz attempt with first question', () => {
      const mockOnAnswerSubmitted = vi.fn();
      const mockOnQuizSubmitted = vi.fn();

      render(
        <QuizAttempt
          quiz={mockQuiz}
          onAnswerSubmitted={mockOnAnswerSubmitted}
          onQuizSubmitted={mockOnQuizSubmitted}
        />
      );

      expect(screen.getByText('HTML Basics')).toBeInTheDocument();
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('What does HTML stand for?')).toBeInTheDocument();
    });

    it('shows progress bar', () => {
      const mockOnAnswerSubmitted = vi.fn();
      const mockOnQuizSubmitted = vi.fn();

      render(
        <QuizAttempt
          quiz={mockQuiz}
          onAnswerSubmitted={mockOnAnswerSubmitted}
          onQuizSubmitted={mockOnQuizSubmitted}
        />
      );

      const progressBar = screen.getByRole('presentation', { hidden: true });
      expect(progressBar).toBeInTheDocument();
    });

    it('shows multiple choice options', () => {
      const mockOnAnswerSubmitted = vi.fn();
      const mockOnQuizSubmitted = vi.fn();

      render(
        <QuizAttempt
          quiz={mockQuiz}
          onAnswerSubmitted={mockOnAnswerSubmitted}
          onQuizSubmitted={mockOnQuizSubmitted}
        />
      );

      expect(screen.getByDisplayValue('Hyper Text Markup Language')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Home Tool Markup Language')).toBeInTheDocument();
    });

    it('allows navigating between questions', () => {
      const mockOnAnswerSubmitted = vi.fn();
      const mockOnQuizSubmitted = vi.fn();

      render(
        <QuizAttempt
          quiz={mockQuiz}
          onAnswerSubmitted={mockOnAnswerSubmitted}
          onQuizSubmitted={mockOnQuizSubmitted}
        />
      );

      // Answer first question
      const firstOption = screen.getByLabelText('Hyper Text Markup Language');
      fireEvent.click(firstOption);

      // Click Next
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(mockOnAnswerSubmitted).toHaveBeenCalled();
    });

    it('shows submit button on last question', () => {
      const mockOnAnswerSubmitted = vi.fn();
      const mockOnQuizSubmitted = vi.fn();

      // Mock the quiz to show we're on last question
      const quizWithAnswer = {
        ...mockQuiz,
        questions: [mockQuiz.questions[1]], // Only last question
      };

      render(
        <QuizAttempt
          quiz={quizWithAnswer}
          onAnswerSubmitted={mockOnAnswerSubmitted}
          onQuizSubmitted={mockOnQuizSubmitted}
        />
      );

      expect(screen.getByText('Submit Quiz')).toBeInTheDocument();
    });
  });

  describe('QuizResult', () => {
    it('renders passed result', () => {
      render(
        <QuizResult attempt={mockAttempt} quiz={mockQuiz} />
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('✓ Quiz Passed')).toBeInTheDocument();
      expect(screen.getByText(/You got 2 out of 2/)).toBeInTheDocument();
    });

    it('shows correct answers', () => {
      render(
        <QuizResult attempt={mockAttempt} quiz={mockQuiz} />
      );

      expect(screen.getByText(/✓ Correct Answers/)).toBeInTheDocument();
      expect(screen.getAllByText('Hyper Text Markup Language').length).toBeGreaterThan(0);
    });

    it('shows wrong answers section when there are wrong answers', () => {
      const failedAttempt = {
        ...mockAttempt,
        score: 50,
        isPassed: false,
        correctCount: 1,
        answers: [
          mockAttempt.answers[0],
          {
            ...mockAttempt.answers[1],
            selectedAnswer: 'True',
            isCorrect: false,
          },
        ],
      };

      render(
        <QuizResult attempt={failedAttempt} quiz={mockQuiz} />
      );

      expect(screen.getByText(/✗ Review Wrong Answers/)).toBeInTheDocument();
    });

    it('allows expanding wrong answers for review', () => {
      const failedAttempt = {
        ...mockAttempt,
        score: 50,
        isPassed: false,
        correctCount: 1,
        answers: [
          mockAttempt.answers[0],
          {
            ...mockAttempt.answers[1],
            selectedAnswer: 'True',
            isCorrect: false,
          },
        ],
      };

      render(
        <QuizResult attempt={failedAttempt} quiz={mockQuiz} />
      );

      const wrongAnswerButtons = screen.getAllByText('Is HTML a programming language?');
      fireEvent.click(wrongAnswerButtons[1]);

      expect(screen.getByText('Your Answer')).toBeInTheDocument();
      expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    });

    it('shows passed message for successful attempts', () => {
      render(
        <QuizResult attempt={mockAttempt} quiz={mockQuiz} />
      );

      expect(screen.getByText(/Great job! You passed/)).toBeInTheDocument();
    });

    it('shows failed message for unsuccessful attempts', () => {
      const failedAttempt = {
        ...mockAttempt,
        score: 40,
        isPassed: false,
        correctCount: 0,
      };

      render(
        <QuizResult attempt={failedAttempt} quiz={mockQuiz} />
      );

      expect(screen.getByText(/You didn't meet the passing/)).toBeInTheDocument();
    });
  });
});
