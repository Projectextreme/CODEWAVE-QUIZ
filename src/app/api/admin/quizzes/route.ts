import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuizStatus } from "@prisma/client";

export async function GET() {
  try {
    await requireAdmin();
    const quizzes = await prisma.quiz.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              where: { deletedAt: null },
              select: { id: true, marks: true },
            },
          },
        },
        attempts: {
          select: { id: true, status: true },
        },
      },
    });

    const formatted = quizzes.map((q) => {
      const totalQuestions = q.sections.reduce(
        (sum, s) => sum + s.questions.length,
        0
      );
      const totalMarks = q.sections.reduce(
        (sum, s) => sum + s.questions.reduce((qSum, qu) => qSum + qu.marks, 0),
        0
      );
      const completedAttempts = q.attempts.filter(
        (a) => a.status === "SUBMITTED"
      ).length;

      return {
        id: q.id,
        title: q.title,
        description: q.description,
        passcode: q.passcode,
        startTime: q.startTime,
        endTime: q.endTime,
        durationMinutes: q.durationMinutes,
        status: q.status,
        isManualActive: q.isManualActive,
        totalSections: q.sections.length,
        totalQuestions,
        totalMarks,
        totalAttempts: q.attempts.length,
        completedAttempts,
        createdAt: q.createdAt,
      };
    });

    return NextResponse.json({ quizzes: formatted });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Fetch quizzes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { title, description, passcode, durationMinutes, startTime, endTime, status } =
      body;

    if (!title) {
      return NextResponse.json(
        { error: "Quiz title is required." },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        passcode: passcode?.trim() || null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 30,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status: status || QuizStatus.DRAFT,
        isManualActive: false,
      },
    });

    // Automatically create a default section for ease of use
    await prisma.section.create({
      data: {
        quizId: quiz.id,
        title: "Section 1",
        orderIndex: 0,
        defaultMarks: 1.0,
      },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Create quiz error:", error);
    return NextResponse.json(
      { error: "Failed to create quiz." },
      { status: 500 }
    );
  }
}
