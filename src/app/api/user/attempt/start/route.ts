import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startAttempt } from "@/lib/services/attempt.service";

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { quizId, passcode } = await req.json();
    if (!quizId) {
      return NextResponse.json({ error: "Quiz ID is required." }, { status: 400 });
    }

    const attempt = await startAttempt(session.userId, quizId, passcode);
    return NextResponse.json({ success: true, attempt });
  } catch (error: any) {
    console.error("Start attempt error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start quiz attempt." },
      { status: 400 }
    );
  }
}
