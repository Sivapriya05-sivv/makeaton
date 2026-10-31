import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guard";

const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name cannot exceed 200 characters"),
  type: z.enum(["software", "service", "addon"]),
  salesPrice: z
    .number()
    .min(0, "Sales price must be greater than or equal to 0"),
  costPrice: z
    .number()
    .min(0, "Cost price must be greater than or equal to 0")
    .optional()
    .default(0),
  notes: z.string().optional().default(""),
});

export async function GET() {
  try {
    await requireUser();

    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        type: true,
        salesPrice: true,
        costPrice: true,
        notes: true,
        active: true,
        createdAt: true,
        variants: {
          select: {
            id: true,
            productId: true,
            name: true,
            priceDelta: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products, { status: 200 });
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
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, type, salesPrice, costPrice, notes } = validation.data;

    const product = await prisma.product.create({
      data: {
        name,
        type,
        salesPrice,
        costPrice,
        notes,
      },
      select: {
        id: true,
        name: true,
        type: true,
        salesPrice: true,
        costPrice: true,
        notes: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
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

