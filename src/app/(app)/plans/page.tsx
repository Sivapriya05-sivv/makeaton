import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PlansClient } from "./components/plans-client";

export default async function PlansPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  const isAdmin = user.role === "admin";

  const [plans, products] = await Promise.all([
    prisma.plan.findMany({
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
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        type: true,
        variants: {
          select: {
            id: true,
            productId: true,
            name: true,
            priceDelta: true,
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Variant name lookup
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

  const formattedPlans = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    productId: plan.productId,
    productName: plan.product.name,
    variantId: plan.variantId,
    variantName: plan.variantId ? variantMap.get(plan.variantId) ?? null : null,
    price: plan.price,
    billingInterval: plan.billingInterval,
    minQuantity: plan.minQuantity,
    availableFrom: plan.availableFrom,
    availableTo: plan.availableTo,
    closePolicy: plan.closePolicy,
    active: plan.active,
    createdAt: plan.createdAt,
    product: plan.product,
  }));

  return (
    <PlansClient
      initialPlans={formattedPlans}
      products={products}
      isAdmin={isAdmin}
    />
  );
}
