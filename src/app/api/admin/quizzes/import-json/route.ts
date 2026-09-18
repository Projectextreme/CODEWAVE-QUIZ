import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestionType, QuizStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const {
      title,
      description,
      passcode,
      durationMinutes,
      startTime,
      endTime,
      status,
      sections,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Quiz 'title' is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: "Quiz must contain at least one section in 'sections' array." },
        { status: 400 }
      );
    }

    // Validate sections and questions
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const sec = sections[sIdx];
      if (!sec.title || typeof sec.title !== "string") {
        return NextResponse.json(
          { error: `Section at index ${sIdx} is missing a valid 'title'.` },
          { status: 400 }
        );
      }

      if (Array.isArray(sec.questions)) {
        for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
          const q = sec.questions[qIdx];
          if (!q.text || typeof q.text !== "string") {
            return NextResponse.json(
              {
                error: `Question ${qIdx + 1} in Section "${sec.title}" is missing 'text'.`,
              },
              { status: 400 }
            );
          }

          if (!Array.isArray(q.options) || q.options.length !== 4) {
            return NextResponse.json(
              {
                error: `Question "${q.text.slice(0, 30)}..." must have exactly 4 options.`,
              },
              { status: 400 }
            );
          }

          const correctCount = q.options.filter((o: any) => o.isCorrect).length;
          if (correctCount !== 1) {
            return NextResponse.json(
              {
                error: `Question "${q.text.slice(0, 30)}..." must have exactly one correct option marked (isCorrect: true).`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Atomically create the quiz
    const createdQuiz = await prisma.$transaction(async (tx) => {
      const quiz = await tx.quiz.create({
        data: {
          title: title.trim(),
          description: description ? String(description).trim() : null,
          passcode: passcode ? String(passcode).trim() : null,
          durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          status: (status as QuizStatus) || QuizStatus.DRAFT,
          isManualActive: false,
        },
      });

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        const section = await tx.section.create({
          data: {
            quizId: quiz.id,
            title: sec.title.trim(),
            description: sec.description ? String(sec.description).trim() : null,
            defaultMarks: sec.defaultMarks ? Number(sec.defaultMarks) : 1.0,
            orderIndex: sIdx,
          },
        });

        if (Array.isArray(sec.questions)) {
          for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
            const q = sec.questions[qIdx];
            const qType =
              q.type === "CODE"
                ? QuestionType.CODE
                : q.type === "IMAGE"
                ? QuestionType.IMAGE
                : QuestionType.THEORY;

            await tx.question.create({
              data: {
                sectionId: section.id,
                type: qType,
                text: q.text.trim(),
                codeSnippet: q.codeSnippet ? String(q.codeSnippet) : null,
                codeLanguage: q.codeLanguage ? String(q.codeLanguage) : null,
                imageUrl: q.imageUrl ? String(q.imageUrl) : null,
                marks: q.marks ? Number(q.marks) : section.defaultMarks,
                orderIndex: qIdx,
                options: {
                  create: q.options.map((opt: any, optIdx: number) => ({
                    text: String(opt.text || "").trim(),
                    isCorrect: Boolean(opt.isCorrect),
                    orderIndex: optIdx,
                  })),
                },
              },
            });
          }
        }
      }

      return quiz;
    });

    return NextResponse.json({ success: true, quiz: createdQuiz });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Import JSON error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import quiz from JSON." },
      { status: 500 }
    );
  }
}
