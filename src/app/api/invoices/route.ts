import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function GET(req: Request) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(req.url);
    const stateParam = searchParams.get("state");
    const limitParam = searchParams.get("limit");

    const limit = limitParam
      ? Math.min(Math.max(parseInt(limitParam, 10) || 100, 1), 500)
      : 100;

    const where: any = {};
    if (user.role === "customer") {
      where.customerId = user.id;
    }
    if (stateParam) {
      where.state = stateParam;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        subscription: {
          select: {
            id: true,
            number: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(invoices, { status: 200 });
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
