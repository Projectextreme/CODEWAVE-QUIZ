import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        team: true,
        _count: {
          select: { attempts: true },
        },
      },
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      teamId: u.teamId,
      teamName: u.team?.name || null,
      totalAttempts: u._count.attempts,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, email, password, role, teamId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        role: role === "ADMIN" ? Role.ADMIN : Role.USER,
        teamId: teamId || null,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { id, name, role, teamId, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    const dataToUpdate: any = {
      name: name?.trim() || undefined,
      role: role ? (role === "ADMIN" ? Role.ADMIN : Role.USER) : undefined,
      teamId: teamId !== undefined ? teamId || null : undefined,
    };

    if (password) {
      dataToUpdate.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID required." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
