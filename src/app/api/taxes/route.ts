import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guard";

const createTaxSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  rate: z
    .number()
    .min(0, "Rate must be between 0 and 1")
    .max(1, "Rate must be between 0 and 1"),
  appliesTo: z.string().trim().min(1).optional().default("all"),
});

export async function GET() {
  try {
    await requireUser();

    const taxes = await prisma.taxRate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(taxes, { status: 200 });
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
    await requireRole("admin");

    const body = await req.json();
    const validation = createTaxSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, rate, appliesTo } = validation.data;

    const tax = await prisma.taxRate.create({
      data: {
        name,
        rate,
        appliesTo,
      },
    });

    return NextResponse.json(tax, { status: 201 });
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

