import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveQuizForUser } from "@/lib/services/quiz.service";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeQuiz = await getActiveQuizForUser(session.userId);
    return NextResponse.json({ activeQuiz });
  } catch (error: any) {
    console.error("Failed to fetch active quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch active quiz." },
      { status: 500 }
    );
  }
}
