import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const quiz = await prisma.quiz.findUnique({
      where: { id, deletedAt: null },
      include: {
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              where: { deletedAt: null },
              orderBy: { orderIndex: "asc" },
              include: {
                options: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Fetch single quiz error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { title, description, passcode, durationMinutes, startTime, endTime, status } =
      body;

    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        passcode: passcode !== undefined ? (passcode?.trim() || null) : undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        startTime: startTime !== undefined ? (startTime ? new Date(startTime) : null) : undefined,
        endTime: endTime !== undefined ? (endTime ? new Date(endTime) : null) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ success: true, quiz });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Update quiz error:", error);
    return NextResponse.json(
      { error: "Failed to update quiz." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Soft delete to protect historical attempts
    await prisma.quiz.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isManualActive: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Delete quiz error:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz." },
      { status: 500 }
    );
  }
}
