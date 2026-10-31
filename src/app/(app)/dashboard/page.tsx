import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Repeat,
  Wallet,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  const now = new Date();

  // Run aggregate queries concurrently via Prisma directly
  const [
    activeSubscriptions,
    paymentAgg,
    outstandingAgg,
    overdueCount,
    overdueInvoicesRaw,
  ] = await Promise.all([
    prisma.subscription.count({
      where: { state: "active" },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      _sum: { grandTotal: true, amountPaid: true },
      where: { state: "confirmed" },
    }),
    prisma.invoice.count({
      where: {
        state: "confirmed",
        dueDate: { lt: now },
      },
    }),
    prisma.invoice.findMany({
      where: {
        state: "confirmed",
        dueDate: { lt: now },
      },
      take: 10,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        number: true,
        customerId: true,
        dueDate: true,
        grandTotal: true,
        amountPaid: true,
      },
    }),
  ]);

  const totalRevenue = paymentAgg._sum.amount ?? 0;
  const confirmedGrandTotal = outstandingAgg._sum.grandTotal ?? 0;
  const confirmedAmountPaid = outstandingAgg._sum.amountPaid ?? 0;
  const outstandingAmount = Math.max(
    0,
    confirmedGrandTotal - confirmedAmountPaid
  );

  // Resolve customer names for the top 10 overdue invoices
  const customerIds = overdueInvoicesRaw
    .map((inv) => inv.customerId)
    .filter((id): id is number => id !== null);

  const customers =
    customerIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const overdueInvoices = overdueInvoicesRaw.map((inv) => {
    const balance = Math.max(0, inv.grandTotal - inv.amountPaid);
    return {
      id: inv.id,
      number: inv.number,
      customerName: inv.customerId
        ? customerMap.get(inv.customerId) ?? `Customer #${inv.customerId}`
        : "Standard Customer",
      dueDate: inv.dueDate,
      balance,
    };
  });

  const overdueAmount = overdueInvoices.reduce(
    (sum, inv) => sum + inv.balance,
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Financial performance, active subscriptions, and cash reconciliation.
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {/* Active Subscriptions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Active subscriptions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Repeat className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {activeSubscriptions.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Outstanding
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(outstandingAmount)}
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Overdue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-rose-600">
              {formatCurrency(overdueAmount)}
            </span>
            <span className="text-xs font-medium text-rose-600">
              {overdueCount} {overdueCount === 1 ? "invoice" : "invoices"}
            </span>
          </div>
        </div>
      </div>

      {/* Overdue Invoices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Overdue invoices
          </h2>
          <Link
            href="/invoices"
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
          >
            <span>View all invoices</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {overdueInvoices.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900">
              No overdue invoices
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              All accounts and invoices are currently in good standing.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-slate-200 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Number
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Customer
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Due date
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Balance
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overdueInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-indigo-600">
                        {inv.number}
                      </td>
                      <td className="px-6 py-4 text-slate-800">
                        {inv.customerName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-rose-600 font-medium text-xs">
                        {inv.dueDate ? formatDate(inv.dueDate) : "Past due"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-slate-900">
                        {formatCurrency(inv.balance)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link
                          href={`/invoices`}
                          className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <span>Review</span>
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

