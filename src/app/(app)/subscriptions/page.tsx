import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowRight, Repeat } from "lucide-react";
import { currentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

const STATE_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  quotation: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function SubscriptionsPage() {
  const user = currentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "customer") {
    redirect("/portal/subscriptions");
  }

  let subscriptions: any[] = [];
  try {
    subscriptions = await (prisma as any).subscription.findMany({
      include: {
        plan: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });
  } catch {
    subscriptions = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Subscriptions
          </h2>
          <p className="text-sm text-slate-500">
            Manage customer recurring billing cycles, contracts, and states.
          </p>
        </div>
        <Link href="/subscriptions/new">
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New subscription
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <Repeat className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No subscriptions yet
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Create your first customer subscription to begin automated recurring billing.
            </p>
            <div className="mt-6">
              <Link href="/subscriptions/new">
                <Button className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New subscription
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Number</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Plan</th>
                  <th scope="col" className="px-6 py-3">Start Date</th>
                  <th scope="col" className="px-6 py-3">Next Billing</th>
                  <th scope="col" className="px-6 py-3">State</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subscriptions.map((sub) => {
                  const badgeStyle =
                    STATE_BADGES[sub.state] ||
                    "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {sub.number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {sub.customer?.name || "Customer #" + sub.customerId}
                        </div>
                        {sub.customer?.email && (
                          <div className="text-xs text-slate-500">
                            {sub.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {sub.plan?.name || "Plan #" + sub.planId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {sub.startDate ? formatDate(sub.startDate) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${badgeStyle}`}
                        >
                          {sub.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/subscriptions/${sub.id}`}
                          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          Detail
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
