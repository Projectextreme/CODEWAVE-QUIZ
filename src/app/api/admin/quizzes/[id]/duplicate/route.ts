import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { duplicateQuiz } from "@/lib/services/quiz.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const duplicated = await duplicateQuiz(id);
    return NextResponse.json({ success: true, quiz: duplicated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Duplicate quiz error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate quiz." },
      { status: 500 }
    );
  }
}
