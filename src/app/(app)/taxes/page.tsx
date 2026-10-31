import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TaxesClient } from "./components/taxes-client";

export default async function TaxesPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  const isAdmin = user.role === "admin";

  const taxes = await prisma.taxRate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <TaxesClient initialTaxes={taxes} isAdmin={isAdmin} />;
}
