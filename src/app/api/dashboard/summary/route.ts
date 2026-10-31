import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  try {
    await requireRole("admin", "staff");

    const [activeSubscriptions, paymentAgg, outstanding, overdueCount] =
      await Promise.all([
        prisma.subscription.count({
          where: { state: "active" },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
        }),
        prisma.invoice.aggregate({
          _sum: { grandTotal: true, amountPaid: true },
          where: { state: "confirmed" },
        }),
        prisma.invoice.count({
          where: {
            state: "confirmed",
            dueDate: { lt: new Date() },
          },
        }),
      ]);

    const totalRevenue = paymentAgg._sum.amount ?? 0;
    const grandTotal = outstanding._sum.grandTotal ?? 0;
    const amountPaid = outstanding._sum.amountPaid ?? 0;
    const outstandingAmount = Math.max(
      0,
      Math.round((grandTotal - amountPaid) * 100) / 100
    );
    const overdueAmount = outstandingAmount;

    return NextResponse.json(
      {
        activeSubscriptions,
        totalRevenue,
        outstandingAmount,
        overdueCount,
        overdueAmount,
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

