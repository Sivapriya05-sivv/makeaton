import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guard";

const lineItemSchema = z.object({
  productId: z.number().int("productId must be an integer"),
  variantId: z.number().int().nullable().optional(),
  qty: z.number().min(1, "qty must be at least 1"),
  unitPrice: z.number().min(0, "unitPrice must be greater than or equal to 0"),
  taxId: z.number().int().nullable().optional(),
});

const createSubscriptionSchema = z.object({
  customerId: z.number().int("customerId must be an integer"),
  planId: z.number().int("planId must be an integer"),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date().nullable().optional(),
  paymentTerms: z.string().nullable().optional(),
  lines: z.array(lineItemSchema).min(1, "lines must have at least 1 item"),
});

export async function GET() {
  try {
    const user = await requireUser();

    const where = user.role === "customer" ? { customerId: user.id } : {};

    const subscriptions = await (prisma as any).subscription.findMany({
      where,
      include: {
        plan: {
          select: {
            name: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    return NextResponse.json(subscriptions, { status: 200 });
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

export async function POST(req: Request) {
  try {
    await requireRole("admin", "staff");

    const body = await req.json();
    const validation = createSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { customerId, planId, startDate, expiryDate, paymentTerms, lines } =
      validation.data;

    const customer = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.role !== "customer") {
      return NextResponse.json(
        { error: "Customer not found or invalid customer role" },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.active) {
      return NextResponse.json(
        { error: "Plan not found or inactive" },
        { status: 400 }
      );
    }

    const totalQty = lines.reduce((sum, line) => sum + line.qty, 0);
    if (totalQty < plan.minQuantity) {
      return NextResponse.json(
        {
          error: `Total quantity (${totalQty}) must be at least the plan minimum quantity (${plan.minQuantity})`,
        },
        { status: 400 }
      );
    }

    const number = `SUB-${Date.now()}`;

    const subscription = await (prisma as any).$transaction(async (tx: any) => {
      return await tx.subscription.create({
        data: {
          number,
          customerId,
          planId,
          startDate,
          expiryDate: expiryDate ?? null,
          paymentTerms: paymentTerms ?? null,
          state: "draft",
          lines: {
            create: lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId ?? null,
              qty: line.qty,
              unitPrice: line.unitPrice,
              taxId: line.taxId ?? null,
            })),
          },
        },
        select: {
          id: true,
          number: true,
        },
      });
    });

    return NextResponse.json(
      {
        id: subscription.id,
        number: subscription.number,
      },
      { status: 201 }
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
