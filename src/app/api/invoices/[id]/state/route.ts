import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { logStateChange } from "@/lib/audit";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  paid: [],
  cancelled: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("admin", "staff");

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid invoice ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const to = body?.to;

    if (!to || typeof to !== "string") {
      return NextResponse.json(
        { error: "Target state 'to' is required and must be a string" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[invoice.state] || [];
    if (!allowedTransitions.includes(to)) {
      return NextResponse.json(
        {
          error: `Invalid invoice state transition from '${invoice.state}' to '${to}'`,
        },
        { status: 400 }
      );
    }

    const fromState = invoice.state;

    await prisma.invoice.update({
      where: { id },
      data: {
        state: to,
      },
    });

    await logStateChange({
      userId: user.id,
      entity: "invoice",
      entityId: id,
      fromState,
      toState: to,
    });

    return NextResponse.json(
      { ok: true, state: to },
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
