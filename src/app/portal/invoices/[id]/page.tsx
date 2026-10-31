import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "./print-button";

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "customer") {
    redirect("/dashboard");
  }

  const invoiceId = parseInt(params.id, 10);
  if (isNaN(invoiceId)) {
    notFound();
  }

  // CRITICAL SECURITY: Customer isolation — strictly scoped by customerId = user.id
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      customerId: user.id,
    },
    include: {
      payments: {
        orderBy: {
          paidOn: "desc",
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const balance = Math.max(0, invoice.grandTotal - invoice.amountPaid);

  const getStateBadge = (state: string) => {
    switch (state) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Paid in Full</span>
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Payment Due</span>
          </span>
        );
      case "void":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
            <XCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Void</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 uppercase">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link and Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal/invoices"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to invoices
        </Link>
        <PrintButton />
      </div>

      {/* Invoice Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xl font-bold text-indigo-600 tracking-tight">
              Brightloop
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              Invoice {invoice.number}
            </h1>
          </div>
          <div>{getStateBadge(invoice.state)}</div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Billed to
            </h2>
            <div className="mt-2 text-sm font-medium text-slate-900">
              {user.name}
            </div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Issue Date
            </h2>
            <div className="mt-2 text-sm font-medium text-slate-900">
              {formatDate(invoice.createdAt)}
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Due Date
            </h2>
            <div className="mt-2 text-sm font-medium text-slate-900">
              {invoice.dueDate ? formatDate(invoice.dueDate) : "Immediate"}
            </div>
          </div>
        </div>

        {/* Summary Breakdown */}
        <div className="py-6 border-b border-slate-200">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Invoice Total</span>
              <span className="font-medium text-slate-900">
                {formatCurrency(invoice.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Amount Paid</span>
              <span className="font-medium text-emerald-600">
                {formatCurrency(invoice.amountPaid)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-slate-900 pt-2 border-t border-slate-200">
              <span>Remaining Balance</span>
              <span className={balance > 0 ? "text-rose-600" : "text-slate-900"}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="pt-6">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 mb-3">
            Payment History
          </h2>
          {invoice.payments.length === 0 ? (
            <p className="text-xs text-slate-500">
              No payments have been recorded for this invoice yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Method</th>
                    <th className="px-4 py-2.5">Note</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-800">
                        {formatDate(p.paidOn)}
                      </td>
                      <td className="px-4 py-2.5 uppercase text-slate-600">
                        {p.method}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {p.note || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-emerald-600">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

