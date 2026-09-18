import { prisma } from "../prisma";
import { AttemptStatus, QuizStatus, Role } from "@prisma/client";
import { resolveActiveQuiz } from "./quiz.service";

export async function getDashboardOverviewStats() {
  const [
    totalUsers,
    totalTeams,
    totalQuizzes,
    activeQuiz,
    completedAttempts,
    inProgressAttempts,
    allCompletedAttempts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: Role.USER } }),
    prisma.team.count(),
    prisma.quiz.count({ where: { deletedAt: null } }),
    resolveActiveQuiz(),
    prisma.attempt.count({ where: { status: AttemptStatus.SUBMITTED } }),
    prisma.attempt.count({ where: { status: AttemptStatus.IN_PROGRESS } }),
    prisma.attempt.findMany({
      where: { status: AttemptStatus.SUBMITTED, totalScore: { not: null } },
      select: { totalScore: true, maxScore: true, percentage: true },
    }),
  ]);

  let avgScore = 0;
  let highestScore = 0;
  let lowestScore = 0;

  if (allCompletedAttempts.length > 0) {
    const scores = allCompletedAttempts.map((a) => a.totalScore ?? 0);
    avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);
  }

  return {
    totalUsers,
    totalTeams,
    totalQuizzes,
    activeQuiz: activeQuiz
      ? {
          id: activeQuiz.id,
          title: activeQuiz.title,
          status: activeQuiz.status,
          isManualActive: activeQuiz.isManualActive,
        }
      : null,
    totalAttempts: completedAttempts + inProgressAttempts,
    completedAttempts,
    inProgressAttempts,
    avgScore,
    highestScore,
    lowestScore,
  };
}

export async function getQuizAnalytics(quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          questions: {
            where: { deletedAt: null },
            orderBy: { orderIndex: "asc" },
            include: {
              options: true,
              answers: {
                include: {
                  attempt: true,
                },
              },
            },
          },
        },
      },
      attempts: {
        include: {
          user: {
            include: { team: true },
          },
        },
      },
    },
  });

  if (!quiz) return null;

  const totalUsers = await prisma.user.count({ where: { role: Role.USER } });
  const completedAttempts = quiz.attempts.filter(
    (a) => a.status === AttemptStatus.SUBMITTED
  );
  const inProgressAttempts = quiz.attempts.filter(
    (a) => a.status === AttemptStatus.IN_PROGRESS
  );
  const notStartedCount = Math.max(0, totalUsers - quiz.attempts.length);

  const scores = completedAttempts
    .map((a) => a.totalScore ?? 0)
    .sort((a, b) => a - b);

  let avgScore = 0;
  let medianScore = 0;
  let highestScore = 0;
  let lowestScore = 0;
  let avgCompletionTimeSecs = 0;

  if (scores.length > 0) {
    avgScore =
      Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) /
      10;
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);

    const mid = Math.floor(scores.length / 2);
    medianScore =
      scores.length % 2 !== 0
        ? scores[mid]
        : Math.round(((scores[mid - 1] + scores[mid]) / 2) * 10) / 10;

    const times = completedAttempts
      .filter((a) => a.submittedAt && a.startedAt)
      .map(
        (a) =>
          (new Date(a.submittedAt!).getTime() -
            new Date(a.startedAt).getTime()) /
          1000
      );

    if (times.length > 0) {
      avgCompletionTimeSecs = Math.round(
        times.reduce((a, b) => a + b, 0) / times.length
      );
    }
  }

  // Question-level metrics
  const allQuestions = quiz.sections.flatMap((s) => s.questions);
  const questionMetrics = allQuestions.map((q) => {
    const validAnswers = q.answers.filter(
      (ans) => ans.attempt.status === AttemptStatus.SUBMITTED
    );
    const totalAns = validAnswers.length;
    const correctCount = validAnswers.filter((a) => a.isCorrect).length;
    const answeredCount = validAnswers.filter(
      (a) => a.selectedOptionId !== null
    ).length;
    const skippedCount = totalAns - answeredCount;
    const incorrectCount = answeredCount - correctCount;

    const correctPct =
      totalAns > 0 ? Math.round((correctCount / totalAns) * 100) : 0;
    const incorrectPct =
      totalAns > 0 ? Math.round((incorrectCount / totalAns) * 100) : 0;
    const skippedPct =
      totalAns > 0 ? Math.round((skippedCount / totalAns) * 100) : 0;
    const avgMarks =
      totalAns > 0
        ? Math.round(
            (validAnswers.reduce((sum, a) => sum + a.marksAwarded, 0) /
              totalAns) *
              10
          ) / 10
        : 0;

    return {
      id: q.id,
      text: q.text,
      type: q.type,
      marks: q.marks,
      totalAttempts: totalAns,
      correctCount,
      incorrectCount,
      skippedCount,
      correctPct,
      incorrectPct,
      skippedPct,
      avgMarks,
    };
  });

  // Score distribution buckets: [0-20%, 21-40%, 41-60%, 61-80%, 81-100%]
  const distribution = [
    { range: "0-20%", count: 0 },
    { range: "21-40%", count: 0 },
    { range: "41-60%", count: 0 },
    { range: "61-80%", count: 0 },
    { range: "81-100%", count: 0 },
  ];

  completedAttempts.forEach((a) => {
    const pct = a.percentage ?? 0;
    if (pct <= 20) distribution[0].count++;
    else if (pct <= 40) distribution[1].count++;
    else if (pct <= 60) distribution[2].count++;
    else if (pct <= 80) distribution[3].count++;
    else distribution[4].count++;
  });

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      durationMinutes: quiz.durationMinutes,
      totalQuestions: allQuestions.length,
      maxMarks: allQuestions.reduce((sum, q) => sum + q.marks, 0),
    },
    metrics: {
      totalParticipants: quiz.attempts.length,
      completed: completedAttempts.length,
      inProgress: inProgressAttempts.length,
      notStarted: notStartedCount,
      avgScore,
      medianScore,
      highestScore,
      lowestScore,
      avgCompletionTimeSecs,
    },
    distribution,
    questionMetrics,
    recentAttempts: quiz.attempts.map((a) => ({
      id: a.id,
      userName: a.user.name,
      userEmail: a.user.email,
      teamName: a.user.team?.name ?? "No Team",
      status: a.status,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      percentage: a.percentage,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    })),
  };
}

export async function getQuizLeaderboard(quizId?: string) {
  // If no quizId specified, pick the active quiz or the most recent quiz
  let targetQuizId = quizId;
  if (!targetQuizId) {
    const active = await resolveActiveQuiz();
    if (active) {
      targetQuizId = active.id;
    } else {
      const latestQuiz = await prisma.quiz.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      targetQuizId = latestQuiz?.id;
    }
  }

  if (!targetQuizId) {
    return { quiz: null, rankings: [] };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: targetQuizId },
    include: {
      sections: {
        include: {
          questions: { where: { deletedAt: null }, select: { marks: true } },
        },
      },
    },
  });

  if (!quiz) {
    return { quiz: null, rankings: [] };
  }

  const maxPossibleScore = quiz.sections.reduce(
    (sum, s) => sum + s.questions.reduce((qSum, q) => qSum + q.marks, 0),
    0
  );

  const teams = await prisma.team.findMany({
    include: {
      users: {
        include: {
          attempts: {
            where: { quizId: targetQuizId },
            include: { user: true },
          },
        },
      },
    },
  });

  const rankings = teams.map((team) => {
    // Look for the team attempt
    const allTeamAttempts = team.users.flatMap((u) => u.attempts);
    const submittedAttempt = allTeamAttempts.find(
      (a) => a.status === AttemptStatus.SUBMITTED
    );
    const inProgressAttempt = allTeamAttempts.find(
      (a) => a.status === AttemptStatus.IN_PROGRESS
    );

    const relevantAttempt = submittedAttempt || inProgressAttempt || null;

    let durationSeconds: number | null = null;
    if (relevantAttempt?.startedAt && relevantAttempt?.submittedAt) {
      durationSeconds = Math.max(
        0,
        Math.floor(
          (new Date(relevantAttempt.submittedAt).getTime() -
            new Date(relevantAttempt.startedAt).getTime()) /
            1000
        )
      );
    }

    return {
      teamId: team.id,
      teamName: team.name,
      hasAttempted: Boolean(relevantAttempt),
      status: relevantAttempt ? relevantAttempt.status : "NOT_ATTEMPTED",
      participant: relevantAttempt?.user
        ? {
            id: relevantAttempt.user.id,
            name: relevantAttempt.user.name,
            email: relevantAttempt.user.email,
          }
        : null,
      totalScore: relevantAttempt?.totalScore ?? 0,
      maxScore: relevantAttempt?.maxScore ?? maxPossibleScore,
      percentage: relevantAttempt?.percentage ?? 0,
      durationSeconds: durationSeconds,
      startedAt: relevantAttempt?.startedAt ?? null,
      submittedAt: relevantAttempt?.submittedAt ?? null,
    };
  });

  // Sort: SUBMITTED (score DESC, duration ASC) -> IN_PROGRESS -> NOT_ATTEMPTED -> Name
  rankings.sort((a, b) => {
    if (a.status === "SUBMITTED" && b.status === "SUBMITTED") {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      // Tie breaker: faster completion time wins
      const timeA = a.durationSeconds ?? 999999;
      const timeB = b.durationSeconds ?? 999999;
      return timeA - timeB;
    }
    if (a.status === "SUBMITTED") return -1;
    if (b.status === "SUBMITTED") return 1;
    if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
    if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;
    return a.teamName.localeCompare(b.teamName);
  });

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      durationMinutes: quiz.durationMinutes,
      maxScore: maxPossibleScore,
    },
    rankings,
  };
}
