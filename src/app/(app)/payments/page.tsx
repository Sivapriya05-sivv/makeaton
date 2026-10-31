import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PaymentsClient } from "./components/payments-client";

export default async function PaymentsPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  // Fetch payments with invoice details
  const paymentsRaw = await prisma.payment.findMany({
    select: {
      id: true,
      invoiceId: true,
      method: true,
      amount: true,
      paidOn: true,
      note: true,
      invoice: {
        select: {
          id: true,
          number: true,
          customerId: true,
          grandTotal: true,
          amountPaid: true,
          state: true,
        },
      },
    },
    orderBy: { paidOn: "desc" },
  });

  // Fetch confirmed invoices with remaining balances
  const confirmedInvoicesRaw = await prisma.invoice.findMany({
    where: {
      state: "confirmed",
    },
    select: {
      id: true,
      number: true,
      customerId: true,
      grandTotal: true,
      amountPaid: true,
    },
    orderBy: { id: "desc" },
  });

  // Collect customer IDs to resolve customer names
  const allCustomerIds = Array.from(
    new Set([
      ...paymentsRaw
        .map((p) => p.invoice.customerId)
        .filter((id): id is number => id !== null),
      ...confirmedInvoicesRaw
        .map((inv) => inv.customerId)
        .filter((id): id is number => id !== null),
    ])
  );

  const customers =
    allCustomerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allCustomerIds } },
          select: { id: true, name: true },
        })
      : [];

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const initialPayments = paymentsRaw.map((p) => ({
    id: p.id,
    invoiceId: p.invoiceId,
    invoiceNumber: p.invoice.number,
    customerName: p.invoice.customerId
      ? customerMap.get(p.invoice.customerId) ?? `Customer #${p.invoice.customerId}`
      : "Standard Customer",
    method: p.method,
    amount: p.amount,
    paidOn: p.paidOn,
    note: p.note,
  }));

  const confirmedInvoices = confirmedInvoicesRaw
    .filter((inv) => inv.grandTotal - inv.amountPaid > 0.001)
    .map((inv) => {
      const remaining = Math.max(0, inv.grandTotal - inv.amountPaid);
      return {
        id: inv.id,
        number: inv.number,
        customerName: inv.customerId
          ? customerMap.get(inv.customerId) ?? `Customer #${inv.customerId}`
          : "Standard Customer",
        grandTotal: inv.grandTotal,
        amountPaid: inv.amountPaid,
        remaining,
      };
    });

  return (
    <PaymentsClient
      initialPayments={initialPayments}
      confirmedInvoices={confirmedInvoices}
    />
  );
}

