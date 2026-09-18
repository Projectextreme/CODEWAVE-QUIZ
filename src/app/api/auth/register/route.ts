import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, teamId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: Role.USER,
        teamId: teamId || null,
      },
      include: { team: true },
    });

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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team ? { id: user.team.id, name: user.team.name } : null,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 }
    );
  }
}
