import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getQuizLeaderboard } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId") || undefined;

    const data = await getQuizLeaderboard(quizId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
