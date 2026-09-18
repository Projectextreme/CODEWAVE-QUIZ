import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { orderedQuestionIds } = await req.json();

    if (Array.isArray(orderedQuestionIds)) {
      await prisma.$transaction(
        orderedQuestionIds.map((qId, idx) =>
          prisma.question.update({
            where: { id: qId },
            data: { orderIndex: idx },
          })
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to reorder questions." },
      { status: 500 }
    );
  }
}
