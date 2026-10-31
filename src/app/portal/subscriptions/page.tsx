import Link from "next/link";
import { redirect } from "next/navigation";
import { Repeat, ArrowRight, CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function PortalSubscriptionsPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "customer") {
    redirect("/dashboard");
  }

  // Tenant Isolation: strictly scoped by customerId = user.id
  const subscriptions = await prisma.subscription.findMany({
    where: {
      customerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const planIds = subscriptions.map((s) => s.planId);
  const plans =
    planIds.length > 0
      ? await prisma.plan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, price: true, billingInterval: true },
        })
      : [];

  const planMap = new Map(plans.map((p) => [p.id, p]));

  const getStateBadge = (state: string) => {
    switch (state) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Active</span>
          </span>
        );
      case "paused":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <PauseCircle className="h-3 w-3 text-amber-600" />
            <span>Paused</span>
          </span>
        );
      case "cancelled":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            <XCircle className="h-3 w-3 text-slate-500" />
            <span className="capitalize">{state}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          My Subscriptions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View your current subscription plans, renewal periods, and billing statuses.
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Repeat className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            No subscriptions yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            You currently do not have any active subscriptions.
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
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Start
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Next billing
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    State
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((sub) => {
                  const plan = planMap.get(sub.planId);
                  const subNumber = `SUB-${String(sub.id).padStart(5, "0")}`;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                        <Link
                          href={`/portal/subscriptions/${sub.id}`}
                          className="hover:underline"
                        >
                          {subNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {plan?.name ?? `Plan #${sub.planId}`}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {formatDate(sub.currentPeriodStart)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {sub.currentPeriodEnd
                          ? formatDate(sub.currentPeriodEnd)
                          : "—"}
                      </td>
                      <td className="px-6 py-4">{getStateBadge(sub.state)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/portal/subscriptions/${sub.id}`}
                          className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          <span>View</span>
                          <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
