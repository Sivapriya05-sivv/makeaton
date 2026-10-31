import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { billSubscription } from "@/engines/billing";

export async function GET() {
  try {
    await requireRole("admin", "staff");

    const now = new Date();

    const due = await prisma.subscription.findMany({
      where: {
        state: "active",
        paused: false,
        nextBillingDate: { lte: now },
      },
      orderBy: {
        id: "asc",
      },
    });

    const preview = await Promise.all(
      due.map((s) => billSubscription(s.id, now, { dryRun: true }))
    );

    return NextResponse.json(
      {
        asOf: now.toISOString(),
        count: preview.length,
        preview,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
