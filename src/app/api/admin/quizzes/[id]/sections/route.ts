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

    const sections = await prisma.section.findMany({
      where: { quizId: id },
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
    });

    return NextResponse.json({ sections });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch sections." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { title, description, defaultMarks } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Section title is required." },
        { status: 400 }
      );
    }

    const count = await prisma.section.count({ where: { quizId: id } });

    const section = await prisma.section.create({
      data: {
        quizId: id,
        title: title.trim(),
        description: description?.trim() || null,
        defaultMarks: defaultMarks ? Number(defaultMarks) : 1.0,
        orderIndex: count,
      },
    });

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create section." },
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
    const { orderedSectionIds } = await req.json();

    if (Array.isArray(orderedSectionIds)) {
      await prisma.$transaction(
        orderedSectionIds.map((secId, idx) =>
          prisma.section.update({
            where: { id: secId },
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
      { error: "Failed to reorder sections." },
      { status: 500 }
    );
  }
}
