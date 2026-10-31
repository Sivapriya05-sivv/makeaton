import { prisma } from "@/lib/prisma";

export async function taxFor(
  productId: number
): Promise<{ rate: number; taxId: number | null }> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return { rate: 0, taxId: null };
  }

  const rule =
    (await prisma.taxRate.findFirst({
      where: { appliesTo: product.type },
    })) ??
    (await prisma.taxRate.findFirst({
      where: { appliesTo: "all" },
    }));

  return rule ? { rate: rule.rate, taxId: rule.id } : { rate: 0, taxId: null };
}
