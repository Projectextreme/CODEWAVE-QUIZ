import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { passcode, name, participant1, participant2, teamName } = await req.json();

    if (!passcode || !passcode.trim()) {
      return NextResponse.json(
        { error: "Quiz Passcode is required." },
        { status: 400 }
      );
    }

    let finalName = name ? String(name).trim() : "";
    if (!finalName) {
      const parts = [participant1, participant2].map((p) => String(p || "").trim()).filter(Boolean);
      finalName = parts.join(", ");
    }

    if (!finalName) {
      return NextResponse.json(
        { error: "Participant name is required." },
        { status: 400 }
      );
    }

    if (!teamName || !teamName.trim()) {
      return NextResponse.json(
        { error: "Team name is required." },
        { status: 400 }
      );
    }

    const trimmedPasscode = passcode.trim();
    const trimmedName = finalName;
    const trimmedTeamName = teamName.trim();

    // 1. Find Quiz matching this passcode
    const quiz = await prisma.quiz.findFirst({
      where: {
        passcode: {
          equals: trimmedPasscode,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });

    if (!quiz) {
      return NextResponse.json(
        {
          error:
            "Invalid Quiz Passcode. Please verify the passcode with your instructor or administrator.",
        },
        { status: 404 }
      );
    }

    // 2. Resolve or create Team by Name
    let team = await prisma.team.findFirst({
      where: {
        name: { equals: trimmedTeamName, mode: "insensitive" },
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: { name: trimmedTeamName },
      });
    }

    // 3. Find existing user with this name in the team, or create a participant record
    let user = await prisma.user.findFirst({
      where: {
        name: { equals: trimmedName, mode: "insensitive" },
        teamId: team.id,
        role: Role.USER,
      },
      include: { team: true },
    });

    if (!user) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const emailSafe = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${randomSuffix}@participant.semaphore`;
      const defaultHash = await hashPassword("semaphore_participant_2026");

      user = await prisma.user.create({
        data: {
          name: trimmedName,
          email: emailSafe,
          passwordHash: defaultHash,
          role: Role.USER,
          teamId: team.id,
        },
        include: { team: true },
      });
    }

    // 4. Create session token & set cookie
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: { id: team.id, name: team.name },
      },
    });
  } catch (error: any) {
    console.error("Passcode login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during participant login." },
      { status: 500 }
    );
  }
}
