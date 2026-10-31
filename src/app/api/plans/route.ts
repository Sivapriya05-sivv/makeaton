import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guard";

const createPlanSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    productId: z.number().int("Product ID must be an integer"),
    variantId: z.number().int().nullable().optional(),
    price: z.number().min(0, "Price must be greater than or equal to 0"),
    billingInterval: z.enum(["daily", "weekly", "monthly", "yearly"]),
    minQuantity: z
      .number()
      .int()
      .min(1, "Minimum quantity must be at least 1")
      .optional()
      .default(1),
    availableFrom: z.coerce.date(),
    availableTo: z.coerce.date().nullable().optional(),
    closePolicy: z
      .enum(["auto", "early", "pause", "renew"])
      .optional()
      .default("auto"),
  })
  .refine(
    (data) => {
      if (data.availableTo) {
        return data.availableTo.getTime() > data.availableFrom.getTime();
      }
      return true;
    },
    {
      message: "availableTo must be after availableFrom",
      path: ["availableTo"],
    }
  );

export async function GET() {
  try {
    await requireUser();

    const plans = await prisma.plan.findMany({
      where: { active: true },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const variantIds = plans
      .map((p) => p.variantId)
      .filter((id): id is number => id !== null);

    const variants =
      variantIds.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, name: true },
          })
        : [];

    const variantMap = new Map(variants.map((v) => [v.id, v.name]));

    const responseData = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      productId: plan.productId,
      productName: plan.product.name,
      variantId: plan.variantId,
      variantName: plan.variantId
        ? variantMap.get(plan.variantId) ?? null
        : null,
      price: plan.price,
      billingInterval: plan.billingInterval,
      minQuantity: plan.minQuantity,
      availableFrom: plan.availableFrom,
      availableTo: plan.availableTo,
      closePolicy: plan.closePolicy,
      active: plan.active,
      createdAt: plan.createdAt,
    }));

    return NextResponse.json(responseData, { status: 200 });
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
    const validation = createPlanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      name,
      productId,
      variantId,
      price,
      billingInterval,
      minQuantity,
      availableFrom,
      availableTo,
      closePolicy,
    } = validation.data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify variant belongs to the product
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { id: true, productId: true },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json(
          { error: "Variant does not belong to the selected product" },
          { status: 400 }
        );
      }
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        productId,
        variantId: variantId ?? null,
        price,
        billingInterval,
        minQuantity,
        availableFrom,
        availableTo: availableTo ?? null,
        closePolicy,
      },
    });

    return NextResponse.json(plan, { status: 201 });
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

