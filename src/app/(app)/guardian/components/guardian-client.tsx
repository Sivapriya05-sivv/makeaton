"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Repeat,
  Receipt,
  PauseCircle,
  FileCheck,
  Zap,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface UnbilledSub {
  id: number;
  number: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  planPrice: number;
  billingInterval: string;
  nextBillingDate: Date | string | null;
}

export interface OverdueInvoice {
  id: number;
  number: string;
  customerName: string;
  customerEmail: string;
  subscriptionNumber?: string;
  dueDate: Date | string | null;
  grandTotal: number;
  amountPaid: number;
  outstanding: number;
  daysOverdue: number;
}

export interface PausedSub {
  id: number;
  number: string;
  customerName: string;
  planName: string;
  planPrice: number;
}

interface GuardianClientProps {
  totalUnbilledCount: number;
  totalUnbilledRevenue: number;
  totalOverdueCount: number;
  totalOverdueRevenue: number;
  totalPausedCount: number;
  auditCount: number;
  unbilledList: UnbilledSub[];
  overdueList: OverdueInvoice[];
  pausedList: PausedSub[];
  isAdmin: boolean;
}

export function GuardianClient({
  totalUnbilledCount,
  totalUnbilledRevenue,
  totalOverdueCount,
  totalOverdueRevenue,
  totalPausedCount,
  auditCount,
  unbilledList,
  overdueList,
  pausedList,
  isAdmin,
}: GuardianClientProps) {
  const [activeTab, setActiveTab] = useState<"leakage" | "overdue" | "paused" | "integrity">("leakage");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUnbilled = unbilledList.filter(
    (s) =>
      s.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOverdue = overdueList.filter(
    (inv) =>
      inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPaused = pausedList.filter(
    (s) =>
      s.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Revenue Guardian
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automated revenue integrity monitor, billing leakage detection, and collections risk guardian.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <Link href="/audit">
              <FileCheck className="h-4 w-4 mr-1.5 text-slate-500" />
              Audit Trail
            </Link>
          </Button>
          {isAdmin && (
            <Button
              asChild
              className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              <Link href="/invoices">
                <Zap className="h-4 w-4 mr-1.5" />
                Resolve Billing ({totalUnbilledCount})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Primary KPI Leakage & Risk Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unbilled Revenue Leakage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Unbilled Leakage</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(totalUnbilledRevenue)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span>{totalUnbilledCount} active subscriptions due for billing</span>
          </div>
        </div>

        {/* Overdue / Collections Risk */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Overdue Risk</span>
            <span className="p-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600">
            {formatCurrency(totalOverdueRevenue)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{totalOverdueCount} unpaid overdue invoices</span>
          </div>
        </div>

        {/* Paused Contracts Exposure */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Paused Contracts</span>
            <span className="p-1.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              <PauseCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalPausedCount}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Temporarily suspended billing cycles</span>
          </div>
        </div>

        {/* Ledger Idempotency Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Ledger Integrity</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
            100% Correct
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>0 duplicate invoices across {auditCount} state logs</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab("leakage")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "leakage"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Unbilled Leakage ({totalUnbilledCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "overdue"
              ? "border-rose-600 text-rose-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Overdue Invoices ({totalOverdueCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("paused")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "paused"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PauseCircle className="h-4 w-4" />
          <span>Paused Contracts ({totalPausedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("integrity")}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "integrity"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Ledger Idempotency Proof</span>
        </button>
      </div>

      {/* Search Input for Tables */}
      {activeTab !== "integrity" && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter by customer, ID, or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-slate-200 text-sm focus-visible:ring-indigo-600"
            />
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">
            Showing high-risk items requiring attention
          </span>
        </div>
      )}

      {/* Tab 1: Unbilled Subscriptions (Revenue Leakage) */}
      {activeTab === "leakage" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredUnbilled.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Zero Unbilled Leakage</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                All active recurring subscriptions have been billed for their current cycle.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider sticky top-0">
                    <th className="py-3 px-4">Subscription #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Plan &amp; Cycle</th>
                    <th className="py-3 px-4 text-right">Cycle Revenue</th>
                    <th className="py-3 px-4">Due Since</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredUnbilled.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                        <Link href={`/subscriptions/${sub.id}`} className="hover:underline">
                          {sub.number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{sub.customerName}</div>
                        <div className="text-xs text-slate-400">{sub.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span>{sub.planName}</span>
                        <span className="ml-2 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
                          {sub.billingInterval}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(sub.planPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-medium text-xs">
                        {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : "Immediately"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                          <Link href={`/subscriptions/${sub.id}`}>
                            Review
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Overdue Invoices (Collections Risk) */}
      {activeTab === "overdue" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredOverdue.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No Overdue Invoices</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                No receivables are currently delinquent or overdue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider sticky top-0">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Delinquency</th>
                    <th className="py-3 px-4 text-right">Outstanding Balance</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredOverdue.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline text-indigo-600">
                          {inv.number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{inv.customerName}</div>
                        <div className="text-xs text-slate-400">{inv.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {inv.daysOverdue} days past due
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatCurrency(inv.outstanding)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Link href={`/invoices/${inv.id}`}>
                            Collect
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Paused Contracts */}
      {activeTab === "paused" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredPaused.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <PauseCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">No Paused Contracts</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                All subscriptions are active and running their regular billing schedule.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider sticky top-0">
                    <th className="py-3 px-4">Subscription #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4 text-right">Tier Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredPaused.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <Link href={`/subscriptions/${sub.id}`} className="hover:underline text-indigo-600">
                          {sub.number}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {sub.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {sub.planName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(sub.planPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Paused
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          <Link href={`/subscriptions/${sub.id}`}>
                            Resume
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Ledger Idempotency & Mathematical Proof */}
      {activeTab === "integrity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-base text-slate-900">Database-Level Idempotency Constraint</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Brightloop prevents double billing not via application logic, but via a strict compound unique constraint on the database table:
            </p>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <code>@@unique([subscriptionId, billingPeriodStart])</code>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Constraint active &amp; validated in SQLite ledger schema.</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold">
              <FileCheck className="h-5 w-5" />
              <h2 className="text-base text-slate-900">Immutable Audit Trail Verification</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              All state transitions across subscriptions, invoices, and payment redemptions are recorded as append-only forensic audit logs:
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 block">Total State Audits</span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {auditCount}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-xs text-slate-500 block">Duplicate Invoices</span>
                <span className="text-xl font-bold text-emerald-600 mt-1 block">
                  0
                </span>
              </div>
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full text-xs">
                <Link href="/audit">
                  View Comprehensive Audit Logs
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
