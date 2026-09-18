import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    console.error("Fetch teams error:", error);
    return NextResponse.json(
      { error: "Failed to load teams." },
      { status: 500 }
    );
  }
}
