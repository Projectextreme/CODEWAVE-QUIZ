import { prisma } from "../prisma";
import { AttemptStatus, QuizStatus } from "@prisma/client";
import { resolveActiveQuiz } from "./quiz.service";

export async function startAttempt(userId: string, quizId: string, passcode?: string) {
  const activeQuiz = await resolveActiveQuiz();
  if (!activeQuiz || activeQuiz.id !== quizId) {
    throw new Error("This quiz is not currently active.");
  }

  // 1. Validate Passcode if quiz has one set
  if (activeQuiz.passcode && activeQuiz.passcode.trim() !== "") {
    if (!passcode || passcode.trim().toLowerCase() !== activeQuiz.passcode.trim().toLowerCase()) {
      throw new Error("Invalid passcode. Please enter the correct quiz passcode.");
    }
  }

  // 2. Fetch user's team information
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, teamId: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  // 3. Check if user already has an attempt
  let attempt = await prisma.attempt.findUnique({
    where: {
      quizId_userId: {
        quizId,
        userId,
      },
    },
    include: {
      answers: true,
    },
  });

  if (attempt) {
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new Error("You have already completed this quiz.");
    }
    return attempt;
  }

  // 4. Enforce: "1 user from each team"
  if (user.teamId) {
    const existingTeamAttempt = await prisma.attempt.findFirst({
      where: {
        quizId,
        teamId: user.teamId,
        userId: { not: userId },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    if (existingTeamAttempt) {
      throw new Error(
        `A member of your team (${existingTeamAttempt.user.name}) has already started/submitted this quiz. Only 1 member per team is permitted to attempt.`
      );
    }
  }

  // Calculate max score
  const allQuestions = activeQuiz.sections.flatMap((s) => s.questions);
  const maxScore = allQuestions.reduce((sum, q) => sum + q.marks, 0);

  // Create new attempt
  attempt = await prisma.attempt.create({
    data: {
      quizId,
      userId,
      teamId: user.teamId,
      startedAt: new Date(),
      status: AttemptStatus.IN_PROGRESS,
      maxScore,
    },
    include: {
      answers: true,
    },
  });

  return attempt;
}

export async function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
  isMarkedForReview: boolean
) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new Error("Invalid attempt.");
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new Error("Attempt has already been submitted.");
  }

  return prisma.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
    create: {
      attemptId,
      questionId,
      selectedOptionId,
      isMarkedForReview,
    },
    update: {
      selectedOptionId,
      isMarkedForReview,
    },
  });
}

export async function submitAttempt(userId: string, attemptId: string) {
  return prisma.$transaction(
    async (tx) => {
      const attempt = await tx.attempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: {
            include: {
              sections: {
                include: {
                  questions: {
                    where: { deletedAt: null },
                    include: {
                      options: true,
                    },
                  },
                },
              },
            },
          },
          answers: true,
        },
      });

      if (!attempt || attempt.userId !== userId) {
        throw new Error("Invalid attempt");
      }

      if (attempt.status !== AttemptStatus.IN_PROGRESS) {
        return attempt; // Already submitted
      }

      const allQuestions = attempt.quiz.sections.flatMap((s) => s.questions);
      let totalScore = 0;
      const maxScore = allQuestions.reduce((sum, q) => sum + q.marks, 0);

      const updates: Promise<any>[] = [];
      const createData: any[] = [];

      for (const question of allQuestions) {
        const existingAnswer = attempt.answers.find(
          (a) => a.questionId === question.id
        );
        const correctOption = question.options.find((o) => o.isCorrect);

        const isCorrect =
          Boolean(existingAnswer?.selectedOptionId) &&
          existingAnswer?.selectedOptionId === correctOption?.id;

        const marksAwarded = isCorrect ? question.marks : 0;
        totalScore += marksAwarded;

        if (existingAnswer) {
          updates.push(
            tx.answer.update({
              where: { id: existingAnswer.id },
              data: {
                isCorrect,
                marksAwarded,
              },
            })
          );
        } else {
          createData.push({
            attemptId: attempt.id,
            questionId: question.id,
            selectedOptionId: null,
            isCorrect: false,
            marksAwarded: 0,
            isMarkedForReview: false,
          });
        }
      }

      if (createData.length > 0) {
        updates.push(
          tx.answer.createMany({
            data: createData,
          })
        );
      }

      // Parallelize all answer score evaluations
      await Promise.all(updates);

      const percentage =
        maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;

      const completedAttempt = await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          status: AttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          totalScore,
          maxScore,
          percentage,
        },
        include: {
          quiz: true,
          answers: {
            include: {
              question: {
                include: {
                  options: true,
                },
              },
              selectedOption: true,
            },
          },
        },
      });

      return completedAttempt;
    },
    {
      maxWait: 10000,
      timeout: 30000,
    }
  );
}

export async function getAttemptDetails(attemptId: string, userId?: string, isAdmin: boolean = false) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      user: {
        include: { team: true },
      },
      quiz: {
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
      },
      answers: {
        include: {
          selectedOption: true,
        },
      },
    },
  });

  if (!attempt) return null;
  if (!isAdmin && attempt.userId !== userId) {
    throw new Error("FORBIDDEN");
  }

  // If student user, sanitize: Withhold questions, answers, and scores
  if (!isAdmin) {
    return {
      id: attempt.id,
      quizId: attempt.quizId,
      userId: attempt.userId,
      teamId: attempt.teamId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      user: {
        id: attempt.user.id,
        name: attempt.user.name,
        email: attempt.user.email,
        role: attempt.user.role,
        team: attempt.user.team ? { id: attempt.user.team.id, name: attempt.user.team.name } : null,
      },
      quiz: {
        id: attempt.quiz.id,
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        durationMinutes: attempt.quiz.durationMinutes,
      },
    };
  }

  return attempt;
}
