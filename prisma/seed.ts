import { PrismaClient, Role, QuizStatus, QuestionType, AttemptStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function withRetry<T>(fn: () => Promise<T>, retries = 4, delay = 800): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 1) throw err;
    console.log(`⚠️ Connection retry in ${delay}ms...`);
    await new Promise((r) => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await withRetry(() => prisma.answer.deleteMany());
  await withRetry(() => prisma.attempt.deleteMany());
  await withRetry(() => prisma.option.deleteMany());
  await withRetry(() => prisma.question.deleteMany());
  await withRetry(() => prisma.section.deleteMany());
  await withRetry(() => prisma.quiz.deleteMany());
  await withRetry(() => prisma.user.deleteMany());
  await withRetry(() => prisma.team.deleteMany());

  console.log("🧹 Cleared old data.");

  // 1. Create Teams
  const teamAlpha = await withRetry(() =>
    prisma.team.create({
      data: { name: "Team Alpha (Cloud Navigators)" },
    })
  );
  const teamBeta = await withRetry(() =>
    prisma.team.create({
      data: { name: "Team Beta (Systems Architects)" },
    })
  );
  const teamGamma = await withRetry(() =>
    prisma.team.create({
      data: { name: "Team Gamma (Frontend Pioneers)" },
    })
  );

  console.log("👥 Created 3 teams.");

  // Password hashes
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("user123", 10);

  // 2. Create Admin
  await withRetry(() =>
    prisma.user.create({
      data: {
        email: "admin@semaphore.com",
        name: "Super Administrator",
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
      },
    })
  );

  // 3. Create Users
  const userNames = [
    { name: "Alex Chen", email: "alex@semaphore.com", teamId: teamAlpha.id },
    { name: "Sarah Jenkins", email: "sarah@semaphore.com", teamId: teamAlpha.id },
    { name: "Marcus Brody", email: "marcus@semaphore.com", teamId: teamAlpha.id },
    { name: "Jordan Taylor", email: "jordan@semaphore.com", teamId: teamBeta.id },
    { name: "Elena Rostova", email: "elena@semaphore.com", teamId: teamBeta.id },
    { name: "Devon Vance", email: "devon@semaphore.com", teamId: teamBeta.id },
    { name: "Maya Patel", email: "maya@semaphore.com", teamId: teamGamma.id },
    { name: "Lucas Silva", email: "lucas@semaphore.com", teamId: teamGamma.id },
    { name: "Zoe Washington", email: "zoe@semaphore.com", teamId: teamGamma.id },
    { name: "Demo User 1", email: "user1@semaphore.com", teamId: teamAlpha.id },
    { name: "Demo User 2", email: "user2@semaphore.com", teamId: teamBeta.id },
  ];

  const createdUsers = [];
  for (const u of userNames) {
    const user = await withRetry(() =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: userPasswordHash,
          role: Role.USER,
          teamId: u.teamId,
        },
      })
    );
    createdUsers.push(user);
  }
  console.log(`👤 Created ${createdUsers.length} student users and 1 admin.`);

  // 4. Create Active Quiz
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const activeQuiz = await withRetry(() =>
    prisma.quiz.create({
      data: {
        title: "Full-Stack Web & Systems Engineering Assessment 2026",
        description:
          "Authoritative comprehensive assessment covering modern React runtime mechanics, PostgreSQL transactions & concurrency, TypeScript type systems, and web performance optimization.",
        passcode: "SEM2026",
        startTime: oneHourAgo,
        endTime: oneHourLater,
        durationMinutes: 45,
        status: QuizStatus.ACTIVE,
        isManualActive: true,
      },
    })
  );

  // Section 1: Theory (1-mark)
  const sec1 = await withRetry(() =>
    prisma.section.create({
      data: {
        quizId: activeQuiz.id,
        title: "Section 1: Architecture & Web Fundamentals",
        description:
          "Core conceptual and architectural questions testing deep knowledge of modern web protocols and runtime behavior.",
        orderIndex: 0,
        defaultMarks: 1.0,
      },
    })
  );

  // Section 2: Code & Diagnostics (2-marks)
  const sec2 = await withRetry(() =>
    prisma.section.create({
      data: {
        quizId: activeQuiz.id,
        title: "Section 2: Code Analysis & Practical Systems",
        description:
          "Code snippets and output analysis questions focusing on asynchronous execution, concurrency, and type inference.",
        orderIndex: 1,
        defaultMarks: 2.0,
      },
    })
  );

  // Questions for Section 1
  const q1 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec1.id,
        type: QuestionType.THEORY,
        text: "In HTTP/2 and HTTP/3 protocols, what primary advantage eliminates the Head-of-Line (HoL) blocking problem at the transport layer in HTTP/3 specifically?",
        marks: 1.0,
        orderIndex: 0,
        options: {
          create: [
            {
              text: "HTTP/3 relies on QUIC over UDP, ensuring packet loss in one stream does not stall other independent streams",
              isCorrect: true,
              orderIndex: 0,
            },
            {
              text: "HTTP/3 opens multiple parallel TCP connections to the server simultaneously",
              isCorrect: false,
              orderIndex: 1,
            },
            {
              text: "HTTP/3 enforces strict synchronous request pipelining over TLS 1.3",
              isCorrect: false,
              orderIndex: 2,
            },
            {
              text: "HTTP/3 replaces binary framing with compressed text-based headers",
              isCorrect: false,
              orderIndex: 3,
            },
          ],
        },
      },
    })
  );

  const q2 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec1.id,
        type: QuestionType.THEORY,
        text: "Which of the following database isolation levels prevents 'Dirty Reads' and 'Non-Repeatable Reads', but in ANSI SQL definition can still permit 'Phantom Reads'?",
        marks: 1.0,
        orderIndex: 1,
        options: {
          create: [
            { text: "Read Uncommitted", isCorrect: false, orderIndex: 0 },
            { text: "Read Committed", isCorrect: false, orderIndex: 1 },
            { text: "Repeatable Read", isCorrect: true, orderIndex: 2 },
            { text: "Serializable", isCorrect: false, orderIndex: 3 },
          ],
        },
      },
    })
  );

  const q3 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec1.id,
        type: QuestionType.THEORY,
        text: "What is the primary architectural purpose of using an Idempotency Key in RESTful API mutations (such as POST /api/payments)?",
        marks: 1.0,
        orderIndex: 2,
        options: {
          create: [
            {
              text: "To encrypt the payload data during transit between the client and edge CDN",
              isCorrect: false,
              orderIndex: 0,
            },
            {
              text: "To guarantee that accidental retries of the same request do not execute duplicated business actions",
              isCorrect: true,
              orderIndex: 1,
            },
            {
              text: "To authenticate user sessions without requiring Bearer tokens or Cookies",
              isCorrect: false,
              orderIndex: 2,
            },
            {
              text: "To compress JSON responses using brotli encoding before delivery",
              isCorrect: false,
              orderIndex: 3,
            },
          ],
        },
      },
    })
  );

  const q4 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec1.id,
        type: QuestionType.THEORY,
        text: "In React 19 / Server Components architecture, what is true regarding Client Component boundaries?",
        marks: 1.0,
        orderIndex: 3,
        options: {
          create: [
            {
              text: "Client Components cannot accept Server Components as children via props",
              isCorrect: false,
              orderIndex: 0,
            },
            {
              text: "The 'use client' directive marks an entry point where code is bundled for client-side hydration and execution",
              isCorrect: true,
              orderIndex: 1,
            },
            {
              text: "Every file in an App Router Next.js project executes solely in the browser by default",
              isCorrect: false,
              orderIndex: 2,
            },
            {
              text: "Client Components can directly query the database using Prisma without API handlers",
              isCorrect: false,
              orderIndex: 3,
            },
          ],
        },
      },
    })
  );

  // Questions for Section 2 (Code Snippets & Systems)
  const q5 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec2.id,
        type: QuestionType.CODE,
        text: "Consider the following asynchronous JavaScript execution sequence. What is the exact output logged to the console?",
        codeLanguage: "javascript",
        codeSnippet: `console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
}).then(() => {
  console.log("4");
});

console.log("5");`,
        marks: 2.0,
        orderIndex: 0,
        options: {
          create: [
            { text: "1, 5, 3, 4, 2", isCorrect: true, orderIndex: 0 },
            { text: "1, 2, 3, 4, 5", isCorrect: false, orderIndex: 1 },
            { text: "1, 5, 2, 3, 4", isCorrect: false, orderIndex: 2 },
            { text: "1, 3, 5, 4, 2", isCorrect: false, orderIndex: 3 },
          ],
        },
      },
    })
  );

  const q6 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec2.id,
        type: QuestionType.CODE,
        text: "What will be the inferred TypeScript type of `Result` in the following conditional mapped type?",
        codeLanguage: "typescript",
        codeSnippet: `type Flatten<T> = T extends Array<infer Item> ? Flatten<Item> : T;

type Nested = number[][][];
type Result = Flatten<Nested>;`,
        marks: 2.0,
        orderIndex: 1,
        options: {
          create: [
            { text: "number", isCorrect: true, orderIndex: 0 },
            { text: "number[]", isCorrect: false, orderIndex: 1 },
            { text: "Array<number[]>", isCorrect: false, orderIndex: 2 },
            { text: "never", isCorrect: false, orderIndex: 3 },
          ],
        },
      },
    })
  );

  const q7 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec2.id,
        type: QuestionType.CODE,
        text: "Given this PostgreSQL transaction with row-level locking, what happens when Transaction B runs concurrently while Transaction A holds the lock?",
        codeLanguage: "sql",
        codeSnippet: `-- Transaction A:
BEGIN;
SELECT * FROM accounts WHERE id = 101 FOR UPDATE;
-- (A performs some calculations...)

-- Transaction B (concurrent):
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 101;`,
        marks: 2.0,
        orderIndex: 2,
        options: {
          create: [
            {
              text: "Transaction B immediately throws a SQL syntax error",
              isCorrect: false,
              orderIndex: 0,
            },
            {
              text: "Transaction B blocks and waits until Transaction A commits or rolls back",
              isCorrect: true,
              orderIndex: 1,
            },
            {
              text: "Transaction B overwrites Transaction A's state without waiting",
              isCorrect: false,
              orderIndex: 2,
            },
            {
              text: "PostgreSQL automatically cancels Transaction A to avoid deadlocks",
              isCorrect: false,
              orderIndex: 3,
            },
          ],
        },
      },
    })
  );

  const q8 = await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: sec2.id,
        type: QuestionType.IMAGE,
        text: "Refer to the system topology diagram below showing distributed read-replicas with a primary write database. Which replication strategy ensures zero replication lag for read-after-write consistency in user sessions?",
        imageUrl:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
        marks: 2.0,
        orderIndex: 3,
        options: {
          create: [
            {
              text: "Routing subsequent immediate reads from the mutating user session to the primary database",
              isCorrect: true,
              orderIndex: 0,
            },
            {
              text: "Broadcasting asynchronous WAL logs every 10 seconds to read replicas",
              isCorrect: false,
              orderIndex: 1,
            },
            {
              text: "Disabling transactions on the primary database during high load",
              isCorrect: false,
              orderIndex: 2,
            },
            {
              text: "Storing write operations inside browser localStorage exclusively",
              isCorrect: false,
              orderIndex: 3,
            },
          ],
        },
      },
    })
  );

  console.log("📝 Seeded active quiz questions.");

  // 5. Create Scheduled & Draft Quizzes
  const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 2 * 60 * 60 * 1000);

  const scheduledQuiz = await withRetry(() =>
    prisma.quiz.create({
      data: {
        title: "Data Structures & Algorithmic Optimization Challenge",
        description:
          "Advanced algorithmic problem-solving quiz focusing on trees, dynamic programming, graph traversals, and amortized complexity.",
        passcode: "ALGO2026",
        startTime: tomorrowStart,
        endTime: tomorrowEnd,
        durationMinutes: 60,
        status: QuizStatus.SCHEDULED,
        isManualActive: false,
      },
    })
  );

  const schedSec = await withRetry(() =>
    prisma.section.create({
      data: {
        quizId: scheduledQuiz.id,
        title: "Graph Algorithms & Tree Traversals",
        orderIndex: 0,
        defaultMarks: 2.0,
      },
    })
  );

  await withRetry(() =>
    prisma.question.create({
      data: {
        sectionId: schedSec.id,
        type: QuestionType.THEORY,
        text: "What is the worst-case time complexity of Dijkstra's algorithm implemented with a Min-Indexed Binary Heap for a graph G(V, E)?",
        marks: 2.0,
        orderIndex: 0,
        options: {
          create: [
            { text: "O((V + E) log V)", isCorrect: true, orderIndex: 0 },
            { text: "O(V^2)", isCorrect: false, orderIndex: 1 },
            { text: "O(E * V)", isCorrect: false, orderIndex: 2 },
            { text: "O(V log E + E^2)", isCorrect: false, orderIndex: 3 },
          ],
        },
      },
    })
  );

  await withRetry(() =>
    prisma.quiz.create({
      data: {
        title: "Cloud Infrastructure & Kubernetes Architecture (Draft)",
        description:
          "Upcoming assessment on cloud-native networking, service meshes, eBPF, and container orchestrations.",
        passcode: "CLOUD2026",
        durationMinutes: 30,
        status: QuizStatus.DRAFT,
        isManualActive: false,
      },
    })
  );

  // 6. Simulate some completed attempts for analytics & leaderboard
  const sampleUsers = createdUsers.slice(0, 6);
  const quizQuestions = [q1, q2, q3, q4, q5, q6, q7, q8];
  const maxScore = quizQuestions.reduce((acc, q) => acc + q.marks, 0); // 1+1+1+1+2+2+2+2 = 12

  for (let i = 0; i < sampleUsers.length; i++) {
    const user = sampleUsers[i];
    const attempt = await withRetry(() =>
      prisma.attempt.create({
        data: {
          quizId: activeQuiz.id,
          userId: user.id,
          startedAt: new Date(now.getTime() - (30 - i * 3) * 60 * 1000),
          submittedAt: new Date(now.getTime() - (10 - i) * 60 * 1000),
          status: AttemptStatus.SUBMITTED,
          maxScore: maxScore,
        },
      })
    );

    let earnedScore = 0;
    for (let qIdx = 0; qIdx < quizQuestions.length; qIdx++) {
      const q = quizQuestions[qIdx];
      const qOptions = await withRetry(() =>
        prisma.option.findMany({ where: { questionId: q.id } })
      );
      const correctOpt = qOptions.find((o) => o.isCorrect);
      const wrongOpt = qOptions.find((o) => !o.isCorrect);

      const isUserCorrect = (i + qIdx) % 3 !== 0;
      const chosenOpt = isUserCorrect ? correctOpt : wrongOpt;
      const marks = isUserCorrect ? q.marks : 0;
      earnedScore += marks;

      if (chosenOpt) {
        await withRetry(() =>
          prisma.answer.create({
            data: {
              attemptId: attempt.id,
              questionId: q.id,
              selectedOptionId: chosenOpt.id,
              isCorrect: isUserCorrect,
              marksAwarded: marks,
              isMarkedForReview: false,
            },
          })
        );
      }
    }

    const percentage = Math.round((earnedScore / maxScore) * 100 * 10) / 10;
    await withRetry(() =>
      prisma.attempt.update({
        where: { id: attempt.id },
        data: {
          totalScore: earnedScore,
          percentage: percentage,
        },
      })
    );
  }

  console.log("📊 Simulated 6 completed attempts with scores.");
  console.log("✅ Database seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
