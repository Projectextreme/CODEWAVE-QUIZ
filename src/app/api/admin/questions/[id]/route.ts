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

    const question = await prisma.question.findUnique({
      where: { id, deletedAt: null },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
        section: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ question });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch question." },
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
    const {
      sectionId,
      type,
      text,
      codeSnippet,
      codeLanguage,
      imageUrl,
      marks,
      options,
    } = body;

    return await prisma.$transaction(async (tx) => {
      // 1. Update question fields
      const updatedQuestion = await tx.question.update({
        where: { id },
        data: {
          sectionId: sectionId || undefined,
          type: type || undefined,
          text: text ? text.trim() : undefined,
          codeSnippet: codeSnippet !== undefined ? codeSnippet?.trim() || null : undefined,
          codeLanguage: codeLanguage !== undefined ? codeLanguage?.trim() || null : undefined,
          imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : undefined,
          marks: marks !== undefined ? Number(marks) : undefined,
        },
      });

      // 2. If options are provided, update them
      if (Array.isArray(options) && options.length === 4) {
        // Delete old options and re-create for clean state
        await tx.option.deleteMany({ where: { questionId: id } });
        await tx.option.createMany({
          data: options.map((opt: any, idx: number) => ({
            questionId: id,
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
            orderIndex: idx,
          })),
        });
      }

      return NextResponse.json({ success: true, question: updatedQuestion });
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Failed to update question." },
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
    await prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete question." },
      { status: 500 }
    );
  }
}
