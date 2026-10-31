import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const createDiscountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Discount code is required")
      .max(50, "Discount code is too long")
      .toUpperCase(),
    type: z.enum(["fixed", "percent"]),
    value: z.number().positive("Value must be greater than 0"),
    minPurchase: z.number().min(0).optional().default(0),
    minQuantity: z.number().int().min(0).optional().default(0),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    maxUses: z.number().int().positive().nullable().optional(),
    scope: z.enum(["product", "subscription"]),
    productId: z.number().int().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "percent") {
        return data.value <= 100;
      }
      return true;
    },
    {
      message: "Percentage discount value cannot exceed 100%",
      path: ["value"],
    }
  )
  .refine(
    (data) => {
      if (data.scope === "product") {
        return typeof data.productId === "number" && data.productId > 0;
      }
      return true;
    },
    {
      message: "productId is required when scope is 'product'",
      path: ["productId"],
    }
  )
  .refine(
    (data) => {
      if (data.endDate) {
        return data.endDate.getTime() > data.startDate.getTime();
      }
      return true;
    },
    {
      message: "endDate must be after startDate",
      path: ["endDate"],
    }
  );

export async function GET() {
  try {
    await requireRole("admin");

    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(discounts, { status: 200 });
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
    const validation = createDiscountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check code uniqueness
    const existing = await prisma.discount.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 409 }
      );
    }

    // If product scope, verify product exists
    if (data.scope === "product" && data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) {
        return NextResponse.json(
          { error: "Referenced product does not exist" },
          { status: 404 }
        );
      }
    }

    const discount = await prisma.discount.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        minQuantity: data.minQuantity,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        maxUses: data.maxUses ?? null,
        scope: data.scope,
        productId: data.scope === "product" ? data.productId : null,
      },
    });

    return NextResponse.json(discount, { status: 201 });
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

