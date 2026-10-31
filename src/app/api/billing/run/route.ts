import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { runBilling } from "@/engines/billing";

export async function POST() {
  try {
    await requireRole("admin", "staff");

    const summary = await runBilling(new Date());

    return NextResponse.json(summary, { status: 200 });
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
