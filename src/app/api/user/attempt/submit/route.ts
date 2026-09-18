import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitAttempt } from "@/lib/services/attempt.service";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attemptId } = await req.json();
    if (!attemptId) {
      return NextResponse.json(
        { error: "Attempt ID is required." },
        { status: 400 }
      );
    }

    const completedAttempt = await submitAttempt(session.userId, attemptId);

    return NextResponse.json({
      success: true,
      result: {
        attemptId: completedAttempt.id,
        totalScore: completedAttempt.totalScore,
        maxScore: completedAttempt.maxScore,
        percentage: completedAttempt.percentage,
        submittedAt: completedAttempt.submittedAt,
      },
    });
  } catch (error: any) {
    console.error("Submit attempt error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit attempt." },
      { status: 400 }
    );
  }
}
