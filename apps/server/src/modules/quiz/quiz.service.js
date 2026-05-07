const prisma = require('../../lib/prisma');
const { ROLES } = require('../auth/auth.constants');
const { createAppError } = require('../../utils/appError');
const { QUIZ_QUESTION_TYPE } = require('./quiz.constants');

const quizInclude = {
  questions: {
    select: {
      id: true,
      prompt: true,
      type: true,
      options: true,
      order: true,
      explanation: true,
    },
    orderBy: { order: 'asc' },
  },
  lesson: {
    select: {
      id: true,
      title: true,
      moduleId: true,
    },
  },
};

const attemptInclude = {
  answers: {
    include: {
      question: {
        select: {
          id: true,
          prompt: true,
          type: true,
          correctAnswer: true,
          explanation: true,
          options: true,
        },
      },
    },
    orderBy: {
      question: { order: 'asc' },
    },
  },
  quiz: {
    select: {
      id: true,
      title: true,
      passingScore: true,
      lesson: {
        select: { id: true },
      },
    },
  },
};

function serializeQuestion(question) {
  return {
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    options: question.options,
    explanation: question.explanation,
    order: question.order,
  };
}

function serializeQuiz(quiz, includeAnswers = false) {
  const questionCount = quiz.questions?.length || 0;

  return {
    id: quiz.id,
    title: quiz.title,
    instructions: quiz.instructions,
    passingScore: quiz.passingScore,
    questionCount,
    ...(includeAnswers && {
      questions: quiz.questions?.map(serializeQuestion) || [],
    }),
    lessonId: quiz.lessonId,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
  };
}

function serializeAttempt(attempt) {
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const isPassed = (attempt.score >= attempt.quiz.passingScore);

  return {
    id: attempt.id,
    quizId: attempt.quizId,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    correctCount,
    isPassed,
    timeTakenSeconds: attempt.timeTakenSeconds,
    answers: attempt.answers.map((answer) => ({
      id: answer.id,
      questionId: answer.questionId,
      prompt: answer.question.prompt,
      type: answer.question.type,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.question.correctAnswer,
      isCorrect: answer.isCorrect,
      explanation: answer.question.explanation,
      options: answer.question.options,
    })),
    createdAt: attempt.createdAt,
  };
}

function isAnswerCorrect(answer, correctAnswer, questionType) {
  if (questionType === QUIZ_QUESTION_TYPE.FILL_BLANK) {
    return answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  return answer.trim() === correctAnswer.trim();
}

async function assertManageableQuiz(user, quizId) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      lesson: {
        select: {
          module: {
            select: {
              course: {
                select: { createdById: true },
              },
            },
          },
        },
      },
      topicPages: {
        select: {
          topicPage: {
            select: { createdById: true },
          },
        },
      },
    },
  });

  if (!quiz) {
    throw createAppError('Quiz not found', 404);
  }

  if (user.role === ROLES.ADMIN) {
    return quiz;
  }

  const isOwner = 
    (quiz.lesson?.module?.course?.createdById === user.id) ||
    (quiz.topicPages.some((tp) => tp.topicPage.createdById === user.id));

  if (!isOwner) {
    throw createAppError('Access denied', 403);
  }

  return quiz;
}

async function createQuiz(user, payload) {
  if (user.role === ROLES.LEARNER) {
    throw createAppError('Learners cannot create quizzes', 403);
  }

  // Validate lesson/topic exists and user owns it
  if (payload.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: payload.lessonId },
      include: {
        module: {
          include: { course: { select: { createdById: true } } },
        },
      },
    });

    if (!lesson) {
      throw createAppError('Lesson not found', 404);
    }

    if (
      user.role !== ROLES.ADMIN &&
      lesson.module.course.createdById !== user.id
    ) {
      throw createAppError('Access denied', 403);
    }

    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId: payload.lessonId },
    });

    if (existingQuiz) {
      throw createAppError(
        'A quiz already exists for this lesson',
        409
      );
    }
  }

  if (payload.topicPageId) {
    const topic = await prisma.topicPage.findUnique({
      where: { id: payload.topicPageId },
      select: { createdById: true, id: true },
    });

    if (!topic) {
      throw createAppError('Topic page not found', 404);
    }

    if (
      user.role !== ROLES.ADMIN &&
      topic.createdById !== user.id
    ) {
      throw createAppError('Access denied', 403);
    }
  }

  const quiz = await prisma.quiz.create({
    data: {
      title: payload.title,
      instructions: payload.instructions,
      passingScore: payload.passingScore,
      lessonId: payload.lessonId,
      questions: {
        create: payload.questions.map((q, index) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.options || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          order: index,
        })),
      },
    },
    include: quizInclude,
  });

  if (payload.topicPageId) {
    await prisma.topicPageQuiz.create({
      data: {
        quizId: quiz.id,
        topicPageId: payload.topicPageId,
      },
    });
  }

  return serializeQuiz(quiz, true);
}

async function getQuiz(user, quizId) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: quizInclude,
  });

  if (!quiz) {
    throw createAppError('Quiz not found', 404);
  }

  // Learners see quiz without correct answers
  const includeAnswers = user.role !== ROLES.LEARNER;

  if (includeAnswers) {
    return serializeQuiz(quiz, true);
  }

  // For learners, don't include correct answers
  return {
    id: quiz.id,
    title: quiz.title,
    instructions: quiz.instructions,
    passingScore: quiz.passingScore,
    questionCount: quiz.questions.length,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      order: q.order,
    })),
    createdAt: quiz.createdAt,
  };
}

async function startQuizAttempt(user, quizId) {
  if (user.role !== ROLES.LEARNER) {
    throw createAppError('Only learners can attempt quizzes', 403);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { id: true, questions: { select: { id: true } } },
  });

  if (!quiz) {
    throw createAppError('Quiz not found', 404);
  }

  if (!quiz.questions.length) {
    throw createAppError('Cannot attempt a quiz with no questions', 400);
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score: 0,
      totalQuestions: quiz.questions.length,
    },
    include: attemptInclude,
  });

  return serializeAttempt(attempt);
}

async function submitQuizAnswer(user, quizId, attemptId, payload) {
  if (user.role !== ROLES.LEARNER) {
    throw createAppError('Only learners can submit answers', 403);
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, quizId: true },
  });

  if (!attempt) {
    throw createAppError('Attempt not found', 404);
  }

  if (attempt.userId !== user.id) {
    throw createAppError('Access denied', 403);
  }

  if (attempt.quizId !== quizId) {
    throw createAppError('Attempt does not match quiz', 400);
  }

  const question = await prisma.quizQuestion.findUnique({
    where: { id: payload.questionId },
    select: { id: true, quizId: true, type: true, correctAnswer: true },
  });

  if (!question) {
    throw createAppError('Question not found', 404);
  }

  if (question.quizId !== quizId) {
    throw createAppError('Question does not belong to this quiz', 400);
  }

  const isCorrect = isAnswerCorrect(
    payload.selectedAnswer,
    question.correctAnswer,
    question.type
  );

  const answer = await prisma.quizAnswer.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId: payload.questionId,
      },
    },
    update: {
      selectedAnswer: payload.selectedAnswer,
      isCorrect,
    },
    create: {
      attemptId,
      questionId: payload.questionId,
      selectedAnswer: payload.selectedAnswer,
      isCorrect,
    },
  });

  return {
    id: answer.id,
    isCorrect,
  };
}

async function submitQuizAttempt(user, quizId, attemptId) {
  if (user.role !== ROLES.LEARNER) {
    throw createAppError('Only learners can submit attempts', 403);
  }

  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: attemptInclude,
  });

  if (!attempt) {
    throw createAppError('Attempt not found', 404);
  }

  if (attempt.userId !== user.id) {
    throw createAppError('Access denied', 403);
  }

  if (attempt.quizId !== quizId) {
    throw createAppError('Attempt does not match quiz', 400);
  }

  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const score = Math.round((correctCount / attempt.totalQuestions) * 100);

  const updatedAttempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { score },
    include: attemptInclude,
  });

  // Update learner progress if quiz is linked to a lesson
  if (attempt.quiz.lesson?.id) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: attempt.quiz.lesson.id },
      select: { topicPageId: true },
    });

    if (lesson?.topicPageId) {
      // Mark learner progress if they passed
      if (score >= attempt.quiz.passingScore) {
        // Update roadmap node progress if needed
        const topic = await prisma.topicPage.findUnique({
          where: { id: lesson.topicPageId },
          select: { roadmapNodeId: true },
        });

        if (topic?.roadmapNodeId) {
          await prisma.userNodeProgress.upsert({
            where: {
              userId_roadmapNodeId: {
                userId: user.id,
                roadmapNodeId: topic.roadmapNodeId,
              },
            },
            create: {
              userId: user.id,
              roadmapNodeId: topic.roadmapNodeId,
              userRoadmapProgressId: '', // Will be set by application logic
              status: 'IN_PROGRESS',
              startedAt: new Date(),
            },
            update: {
              status: 'IN_PROGRESS',
              startedAt: new Date(),
            },
          });
        }
      }
    }
  }

  return serializeAttempt(updatedAttempt);
}

async function getQuizAttempt(user, quizId, attemptId) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: attemptInclude,
  });

  if (!attempt) {
    throw createAppError('Attempt not found', 404);
  }

  if (attempt.quizId !== quizId) {
    throw createAppError('Attempt does not match quiz', 400);
  }

  if (user.role === ROLES.LEARNER && attempt.userId !== user.id) {
    throw createAppError('Access denied', 403);
  }

  return serializeAttempt(attempt);
}

async function getMyQuizAttempts(user, quizId) {
  if (user.role !== ROLES.LEARNER) {
    throw createAppError('Only learners can view their attempts', 403);
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      quizId,
      userId: user.id,
    },
    include: attemptInclude,
    orderBy: { createdAt: 'desc' },
  });

  return attempts.map(serializeAttempt);
}

module.exports = {
  createQuiz,
  getQuiz,
  startQuizAttempt,
  submitQuizAnswer,
  submitQuizAttempt,
  getQuizAttempt,
  getMyQuizAttempts,
  assertManageableQuiz,
};
