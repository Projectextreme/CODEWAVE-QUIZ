import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDashboardOverviewStats } from "@/lib/services/analytics.service";

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getDashboardOverviewStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }
    console.error("Overview stats error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard overview." },
      { status: 500 }
    );
  }
}
