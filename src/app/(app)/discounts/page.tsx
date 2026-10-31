import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DiscountsClient } from "./components/discounts-client";

export default async function DiscountsPage() {
  const user = currentUser();

  // Admin only — if role !== 'admin' redirect('/dashboard')
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const discounts = await prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
  });

  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <DiscountsClient
      initialDiscounts={discounts}
      products={products}
    />
  );
}
