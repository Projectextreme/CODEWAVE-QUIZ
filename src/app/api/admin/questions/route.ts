import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
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

    if (!sectionId || !text) {
      return NextResponse.json(
        { error: "Section and question text are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length !== 4) {
      return NextResponse.json(
        { error: "Exactly 4 options are required." },
        { status: 400 }
      );
    }

    const correctCount = options.filter((o: any) => o.isCorrect).length;
    if (correctCount !== 1) {
      return NextResponse.json(
        { error: "Exactly one correct option must be selected." },
        { status: 400 }
      );
    }

    const count = await prisma.question.count({
      where: { sectionId, deletedAt: null },
    });

    const question = await prisma.question.create({
      data: {
        sectionId,
        type: type || QuestionType.THEORY,
        text: text.trim(),
        codeSnippet: codeSnippet?.trim() || null,
        codeLanguage: codeLanguage?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        marks: marks ? Number(marks) : 1.0,
        orderIndex: count,
        options: {
          create: options.map((opt: any, idx: number) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
            orderIndex: idx,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Failed to create question." },
      { status: 500 }
    );
  }
}
