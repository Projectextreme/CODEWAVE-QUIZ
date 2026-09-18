import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    const status = searchParams.get("status");

    const attempts = await prisma.attempt.findMany({
      where: {
        quizId: quizId || undefined,
        status: (status as any) || undefined,
      },
      orderBy: { startedAt: "desc" },
      include: {
        user: {
          include: { team: true },
        },
        quiz: {
          select: { id: true, title: true },
        },
      },
      take: 100,
    });

    const formatted = attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      userId: a.userId,
      userName: a.user.name,
      userEmail: a.user.email,
      teamName: a.user.team?.name || "No Team",
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      status: a.status,
      totalScore: a.totalScore,
      maxScore: a.maxScore,
      percentage: a.percentage,
    }));

    return NextResponse.json({ attempts: formatted });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch attempts." },
      { status: 500 }
    );
  }
}
