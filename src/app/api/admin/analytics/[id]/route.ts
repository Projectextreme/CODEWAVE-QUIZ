import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getQuizAnalytics } from "@/lib/services/analytics.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const analytics = await getQuizAnalytics(id);

    if (!analytics) {
      return NextResponse.json(
        { error: "Quiz not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ analytics });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to load quiz analytics." },
      { status: 500 }
    );
  }
}
