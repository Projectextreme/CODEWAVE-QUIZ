import { prisma } from "../prisma";
import { QuizStatus, AttemptStatus } from "@prisma/client";

export async function resolveActiveQuiz() {
  try {
    const now = new Date();

    // 1. Check if there is a manually active quiz
    let active = await prisma.quiz.findFirst({
      where: {
        deletedAt: null,
        isManualActive: true,
        status: { not: QuizStatus.COMPLETED },
      },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
              include: {
                options: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    // 2. If no manually active quiz, check scheduled quiz that falls within time window
    if (!active) {
      active = await prisma.quiz.findFirst({
        where: {
          deletedAt: null,
          status: { in: [QuizStatus.SCHEDULED, QuizStatus.ACTIVE] },
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: {
          sections: {
            orderBy: { orderIndex: "asc" },
            include: {
              questions: {
                where: { deletedAt: null },
                orderBy: { orderIndex: "asc" },
                include: {
                  options: {
                    orderBy: { orderIndex: "asc" },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Check if scheduled quizzes have expired and update status
    await prisma.quiz.updateMany({
      where: {
        deletedAt: null,
        status: QuizStatus.SCHEDULED,
        endTime: { lt: now },
        isManualActive: false,
      },
      data: {
        status: QuizStatus.COMPLETED,
      },
    }).catch(() => {});

    return active;
  } catch (err) {
    console.error("resolveActiveQuiz error:", err);
    return null;
  }
}

// Helper function to deterministically shuffle an array based on a seed string
function shuffleArraySeeded<T>(array: T[], seedStr: string): T[] {
  if (array.length <= 1) return array;

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  let seed = Math.abs(hash) || 1;
  const nextRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getActiveQuizForUser(userId: string) {
  const activeQuiz = await resolveActiveQuiz();
  if (!activeQuiz) return null;

  try {
    // Check user's attempt for this quiz
    const userAttempt = await prisma.attempt.findUnique({
      where: {
        quizId_userId: {
          quizId: activeQuiz.id,
          userId: userId,
        },
      },
      include: {
        answers: true,
      },
    });

    const seedBase = `${activeQuiz.id}_${userId}`;

    // Sanitize quiz: NEVER send isCorrect to client; shuffle options deterministically per user
    const sanitizedSections = activeQuiz.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      orderIndex: section.orderIndex,
      defaultMarks: section.defaultMarks,
      questions: section.questions.map((q) => {
        const rawOptions = q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          orderIndex: opt.orderIndex,
        }));

        // Shuffle options randomly per user for this question
        const shuffledOptions = shuffleArraySeeded(rawOptions, `${seedBase}_${q.id}`);

        return {
          id: q.id,
          sectionId: q.sectionId,
          type: q.type,
          text: q.text,
          codeSnippet: q.codeSnippet,
          codeLanguage: q.codeLanguage,
          imageUrl: q.imageUrl,
          marks: q.marks,
          orderIndex: q.orderIndex,
          options: shuffledOptions,
        };
      }),
    }));

    const totalQuestions = sanitizedSections.reduce(
      (acc, sec) => acc + sec.questions.length,
      0
    );
    const totalMarks = sanitizedSections.reduce(
      (acc, sec) =>
        acc + sec.questions.reduce((qAcc, q) => qAcc + q.marks, 0),
      0
    );

    return {
      id: activeQuiz.id,
      title: activeQuiz.title,
      description: activeQuiz.description,
      startTime: activeQuiz.startTime,
      endTime: activeQuiz.endTime,
      durationMinutes: activeQuiz.durationMinutes,
      status: activeQuiz.status,
      hasPasscode: Boolean(activeQuiz.passcode && activeQuiz.passcode.trim() !== ""),
      totalQuestions,
      totalMarks,
      sections: sanitizedSections,
      userAttempt: userAttempt
        ? {
            id: userAttempt.id,
            status: userAttempt.status,
            startedAt: userAttempt.startedAt,
            submittedAt: userAttempt.submittedAt,
            answers: userAttempt.answers.map((a) => ({
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isMarkedForReview: a.isMarkedForReview,
            })),
          }
        : null,
    };
  } catch (err) {
    console.error("getActiveQuizForUser error:", err);
    return null;
  }
}

export async function activateQuiz(quizId: string) {
  return prisma.$transaction(
    async (tx) => {
      // Deactivate any currently active quizzes
      await tx.quiz.updateMany({
        where: {
          id: { not: quizId },
          isManualActive: true,
        },
        data: {
          isManualActive: false,
        },
      });

      // Activate this quiz
      return tx.quiz.update({
        where: { id: quizId },
        data: {
          isManualActive: true,
          status: QuizStatus.ACTIVE,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
}

export async function deactivateQuiz(quizId: string) {
  return prisma.quiz.update({
    where: { id: quizId },
    data: {
      isManualActive: false,
      status: QuizStatus.COMPLETED,
    },
  });
}

export async function duplicateQuiz(quizId: string) {
  const original = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: {
            where: { deletedAt: null },
            orderBy: { orderIndex: "asc" },
            include: {
              options: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!original) throw new Error("Quiz not found");

  return prisma.$transaction(async (tx) => {
    const duplicatedQuiz = await tx.quiz.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        passcode: original.passcode,
        durationMinutes: original.durationMinutes,
        status: QuizStatus.DRAFT,
        isManualActive: false,
      },
    });

    for (const section of original.sections) {
      const newSec = await tx.section.create({
        data: {
          quizId: duplicatedQuiz.id,
          title: section.title,
          description: section.description,
          orderIndex: section.orderIndex,
          defaultMarks: section.defaultMarks,
        },
      });

      for (const q of section.questions) {
        await tx.question.create({
          data: {
            sectionId: newSec.id,
            type: q.type,
            text: q.text,
            codeSnippet: q.codeSnippet,
            codeLanguage: q.codeLanguage,
            imageUrl: q.imageUrl,
            marks: q.marks,
            orderIndex: q.orderIndex,
            options: {
              create: q.options.map((opt) => ({
                text: opt.text,
                isCorrect: opt.isCorrect,
                orderIndex: opt.orderIndex,
              })),
            },
          },
        });
      }
    }

    return duplicatedQuiz;
  });
}
