import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveAnswer } from "@/lib/services/attempt.service";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { attemptId, questionId, selectedOptionId, isMarkedForReview } =
      await req.json();

    if (!attemptId || !questionId) {
      return NextResponse.json(
        { error: "Attempt ID and Question ID are required." },
        { status: 400 }
      );
    }

    const answer = await saveAnswer(
      session.userId,
      attemptId,
      questionId,
      selectedOptionId,
      Boolean(isMarkedForReview)
    );

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error("Save answer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save answer." },
      { status: 400 }
    );
  }
}
