import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalSubscriptionDetailPage({
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

  const subId = parseInt(params.id, 10);
  if (isNaN(subId)) {
    notFound();
  }

  // Tenant Isolation: strictly scoped by customerId = user.id
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subId,
      customerId: user.id,
    },
  });

  if (!subscription) {
    notFound();
  }

  const plan = await prisma.plan.findUnique({
    where: { id: subscription.planId },
    include: { product: true },
  });

  const subNumber = `SUB-${String(subscription.id).padStart(5, "0")}`;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/portal/subscriptions"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to subscriptions
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Subscription {subNumber}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Enrolled in {plan?.product?.name ?? "Service"}
          </p>
        </div>

        <div>
          {subscription.state === "active" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              <XCircle className="h-3.5 w-3.5 text-slate-500" />
              {subscription.state}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 mb-4">
          Plan Details
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium text-slate-500">Plan</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {plan?.name ?? `Plan #${subscription.planId}`}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Price & Cadence</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {plan ? `${formatCurrency(plan.price)} / ${plan.billingInterval}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Current Period</dt>
            <dd className="mt-1 text-sm font-medium text-slate-700">
              {formatDate(subscription.currentPeriodStart)} -{" "}
              {subscription.currentPeriodEnd
                ? formatDate(subscription.currentPeriodEnd)
                : "Ongoing"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
