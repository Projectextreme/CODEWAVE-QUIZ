import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAttemptDetails } from "@/lib/services/attempt.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const attempt = await getAttemptDetails(
      id,
      session.userId,
      session.role === "ADMIN"
    );

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ attempt });
  } catch (error: any) {
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch attempt details." },
      { status: 500 }
    );
  }
}
