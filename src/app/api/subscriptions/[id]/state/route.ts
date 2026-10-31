import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["quotation"],
  quotation: ["confirmed"],
  confirmed: ["active"],
  active: ["closed"],
  closed: [],
};

function logStateChange(
  subscriptionId: number,
  oldState: string,
  newState: string,
  userId?: number
) {
  console.log(
    `[SUBSCRIPTION_STATE_CHANGE] Subscription #${subscriptionId} state changed from '${oldState}' to '${newState}' by userId: ${userId ?? "system"}`
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole("admin", "staff");

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid subscription ID" },
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

    const subscription = await (prisma as any).subscription.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            closePolicy: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const allowedTransitions = VALID_TRANSITIONS[subscription.state] || [];
    if (!allowedTransitions.includes(to)) {
      return NextResponse.json(
        {
          error: `Invalid state transition from '${subscription.state}' to '${to}'`,
        },
        { status: 400 }
      );
    }

    if (to === "closed" && subscription.plan?.closePolicy === "auto") {
      return NextResponse.json(
        { error: "Plan is auto-close only" },
        { status: 400 }
      );
    }

    const updateData: any = {
      state: to,
    };

    if (to === "active") {
      updateData.nextBillingDate = subscription.startDate;
    }

    await (prisma as any).subscription.update({
      where: { id },
      data: updateData,
    });

    logStateChange(id, subscription.state, to, user.id);

    try {
      if ((prisma as any).auditLog) {
        await (prisma as any).auditLog.create({
          data: {
            entity: "subscription",
            entityId: id,
            fromState: subscription.state,
            toState: to,
            userId: user.id,
          },
        });
      }
    } catch {
      // Ignored if auditLog table is not in schema
    }

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
