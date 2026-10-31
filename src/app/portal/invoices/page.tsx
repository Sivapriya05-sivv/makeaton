import Link from "next/link";
import { redirect } from "next/navigation";
import { Receipt, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalInvoicesPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "customer") {
    redirect("/dashboard");
  }

  // Tenant Isolation: strictly scoped by customerId = user.id
  const invoices = await prisma.invoice.findMany({
    where: {
      customerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getStateBadge = (state: string) => {
    switch (state) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Paid</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>Payment Due</span>
          </span>
        );
      case "void":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>Void</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 uppercase">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          My Invoices
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review billed statements, payment history, and outstanding balances.
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            No invoices yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Your billing invoices and payment receipts will appear here once generated.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Number
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Issue date
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Due date
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Paid
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    State
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="hover:underline"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {inv.dueDate ? formatDate(inv.dueDate) : "Immediate"}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="px-6 py-4">{getStateBadge(inv.state)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        <span>View</span>
                        <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
  );
}
