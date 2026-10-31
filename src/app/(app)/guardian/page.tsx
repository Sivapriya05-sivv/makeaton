import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { GuardianClient } from "./components/guardian-client";

export default async function GuardianPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  const isAdmin = user.role === "admin";
  const now = new Date();

  // 1. Fetch unbilled active subscriptions past their nextBillingDate
  const [
    unbilledTotalCount,
    unbilledSubs,
    overdueInvoices,
    pausedSubs,
    auditCount,
    overdueAgg,
  ] = await Promise.all([
    prisma.subscription.count({
      where: {
        state: "active",
        paused: false,
        nextBillingDate: { lte: now },
      },
    }),
    prisma.subscription.findMany({
      where: {
        state: "active",
        paused: false,
        nextBillingDate: { lte: now },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true, billingInterval: true } },
      },
      orderBy: { nextBillingDate: "asc" },
      take: 100,
    }),
    prisma.invoice.findMany({
      where: {
        state: "confirmed",
        dueDate: { lt: now },
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        subscription: { select: { number: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 100,
    }),
    prisma.subscription.findMany({
      where: {
        paused: true,
      },
      include: {
        customer: { select: { id: true, name: true } },
        plan: { select: { name: true, price: true } },
      },
      take: 50,
    }),
    prisma.auditLog.count(),
    prisma.invoice.aggregate({
      where: {
        state: "confirmed",
        dueDate: { lt: now },
      },
      _sum: {
        grandTotal: true,
        amountPaid: true,
      },
    }),
  ]);

  // Calculations
  const totalUnbilledRevenue = unbilledSubs.reduce(
    (acc, s) => acc + (s.plan?.price || 0),
    0
  );

  const totalOverdueRevenue = Math.max(
    0,
    (overdueAgg._sum.grandTotal ?? 0) - (overdueAgg._sum.amountPaid ?? 0)
  );

  const formattedUnbilled = unbilledSubs.map((s) => ({
    id: s.id,
    number: s.number,
    customerName: s.customer.name,
    customerEmail: s.customer.email,
    planName: s.plan.name,
    planPrice: s.plan.price,
    billingInterval: s.plan.billingInterval,
    nextBillingDate: s.nextBillingDate,
  }));

  const formattedOverdue = overdueInvoices.map((inv) => {
    const grand = inv.grandTotal;
    const paid = inv.amountPaid;
    const outstanding = Math.max(0, grand - paid);
    const dueTime = inv.dueDate ? new Date(inv.dueDate).getTime() : now.getTime();
    const daysOverdue = Math.max(
      1,
      Math.floor((now.getTime() - dueTime) / (1000 * 60 * 60 * 24))
    );

    return {
      id: inv.id,
      number: inv.number,
      customerName: inv.customer?.name || "Customer",
      customerEmail: inv.customer?.email || "",
      subscriptionNumber: inv.subscription?.number,
      dueDate: inv.dueDate,
      grandTotal: grand,
      amountPaid: paid,
      outstanding,
      daysOverdue,
    };
  });

  const formattedPaused = pausedSubs.map((s) => ({
    id: s.id,
    number: s.number,
    customerName: s.customer.name,
    planName: s.plan.name,
    planPrice: s.plan.price,
  }));

  return (
    <GuardianClient
      totalUnbilledCount={unbilledTotalCount}
      totalUnbilledRevenue={totalUnbilledRevenue}
      totalOverdueCount={overdueInvoices.length}
      totalOverdueRevenue={totalOverdueRevenue}
      totalPausedCount={pausedSubs.length}
      auditCount={auditCount}
      unbilledList={formattedUnbilled}
      overdueList={formattedOverdue}
      pausedList={formattedPaused}
      isAdmin={isAdmin}
    />
  );
}
