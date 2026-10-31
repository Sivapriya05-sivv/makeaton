import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, User, Repeat, CreditCard } from "lucide-react";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate, formatCurrency } from "@/lib/format";
import { StateActions } from "./state-actions";

const STATE_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  quotation: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function SubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    notFound();
  }

  let subscription: any = null;
  try {
    subscription = await (prisma as any).subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                salesPrice: true,
              },
            },
          },
        },
      },
    });
  } catch {
    subscription = null;
  }

  if (!subscription) {
    notFound();
  }

  if (user.role === "customer" && subscription.customerId !== user.id) {
    redirect("/portal/subscriptions");
  }

  const badgeStyle =
    STATE_BADGES[subscription.state] ||
    "bg-slate-100 text-slate-700 border-slate-200";

  const totalAmount = (subscription.lines || []).reduce(
    (acc: number, line: any) => acc + (line.qty || 1) * (line.unitPrice || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 font-mono">
                {subscription.number}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${badgeStyle}`}
              >
                {subscription.state}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Subscription contract for {subscription.customer?.name || "Customer #" + subscription.customerId}
            </p>
          </div>
        </div>

        {/* State Action Transitions */}
        {user.role !== "customer" && (
          <StateActions
            subscriptionId={subscription.id}
            currentState={subscription.state}
          />
        )}
      </div>

      {/* Contract Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <User className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Customer
            </span>
          </div>
          <div className="font-semibold text-slate-900 truncate">
            {subscription.customer?.name || "Customer #" + subscription.customerId}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {subscription.customer?.email}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <Repeat className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Plan
            </span>
          </div>
          <div className="font-semibold text-slate-900 truncate">
            {subscription.plan?.name || "Plan #" + subscription.planId}
          </div>
          <div className="text-xs text-slate-500 capitalize">
            {subscription.plan?.billingInterval || "Recurring"} cycle
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Start & Expiry
            </span>
          </div>
          <div className="font-semibold text-slate-900">
            {subscription.startDate ? formatDate(subscription.startDate) : "—"}
          </div>
          <div className="text-xs text-slate-500">
            Expires: {subscription.expiryDate ? formatDate(subscription.expiryDate) : "Indefinite"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Next Billing
            </span>
          </div>
          <div className="font-semibold text-slate-900">
            {subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "—"}
          </div>
          <div className="text-xs text-slate-500">
            Terms: {subscription.paymentTerms ? `${subscription.paymentTerms} days` : "Immediate"}
          </div>
        </div>
      </div>

      {/* Subscription Lines Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Subscription Line Items
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {subscription.lines?.length || 0} item{(subscription.lines?.length || 0) === 1 ? "" : "s"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Product</th>
                <th scope="col" className="px-6 py-3 text-right">Quantity</th>
                <th scope="col" className="px-6 py-3 text-right">Unit Price</th>
                <th scope="col" className="px-6 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(subscription.lines || []).map((line: any, idx: number) => {
                const subtotal = (line.qty || 1) * (line.unitPrice || 0);

                return (
                  <tr key={line.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {line.product?.name || `Product #${line.productId}`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {line.qty}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-medium text-slate-900">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-xs uppercase tracking-wider text-slate-500">
                  Total Recurring Value
                </td>
                <td className="px-6 py-3 text-right font-mono font-semibold text-base text-indigo-600">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
