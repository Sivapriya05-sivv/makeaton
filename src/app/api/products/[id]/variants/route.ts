import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, requireRole } from "@/lib/guard";

const createVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters"),
  priceDelta: z.number().optional().default(0),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();

    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

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

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      select: {
        id: true,
        productId: true,
        name: true,
        priceDelta: true,
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(variants, { status: 200 });
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole("admin");

    const productId = parseInt(params.id, 10);
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validation = createVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, priceDelta } = validation.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, salesPrice: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (priceDelta < -product.salesPrice) {
      return NextResponse.json(
        { error: "Variant discount cannot exceed base price" },
        { status: 400 }
      );
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name,
        priceDelta,
      },
      select: {
        id: true,
        productId: true,
        name: true,
        priceDelta: true,
      },
    });

    return NextResponse.json(variant, { status: 201 });
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

