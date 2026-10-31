import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProductsTable } from "./components/products-table";

export default async function ProductsPage() {
  const user = currentUser();
  const isAdmin = user?.role === "admin";

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
        orderBy: { id: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <ProductsTable initialProducts={products} isAdmin={isAdmin} />
    </div>
  );
}

