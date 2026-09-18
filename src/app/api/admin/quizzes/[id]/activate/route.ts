import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { activateQuiz, deactivateQuiz } from "@/lib/services/quiz.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action } = await req.json(); // "activate" or "deactivate"

    let updated;
    if (action === "activate") {
      updated = await activateQuiz(id);
    } else {
      updated = await deactivateQuiz(id);
    }

    return NextResponse.json({ success: true, quiz: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Quiz toggle active error:", error);
    return NextResponse.json(
      { error: "Failed to update quiz active status." },
      { status: 500 }
    );
  }
}
