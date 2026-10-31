"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Play,
  Eye,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

interface Invoice {
  id: number;
  number: string;
  customerId: number;
  subscriptionId: number;
  issueDate: string;
  dueDate: string;
  grandTotal: number;
  amountPaid: number;
  state: string;
  subscription?: {
    id: number;
    number: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface PreviewItem {
  wouldCreate?: boolean;
  subId?: number;
  periodStart?: string;
  periodEnd?: string;
  subtotal?: number;
  taxTotal?: number;
  grandTotal?: number;
  skipped?: string;
}

const STATE_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200 line-through",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Billing Run & Preview State
  const [runningBilling, setRunningBilling] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    asOf: string;
    count: number;
    preview: PreviewItem[];
  } | null>(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices?limit=200");
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch {
      setErrorMessage("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePreviewBilling = async () => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/billing/preview");
      if (res.ok) {
        setPreviewData(await res.json());
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to load billing preview.");
        setPreviewOpen(false);
      }
    } catch {
      setErrorMessage("Network error loading billing preview.");
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRunBilling = async () => {
    setRunningBilling(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/billing/run", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setToastMessage(`${data.created} invoices created, ${data.skipped} skipped`);
        setTimeout(() => setToastMessage(null), 5000);
        await fetchInvoices();
      } else {
        setErrorMessage(data.error || "Failed to execute billing run.");
      }
    } catch {
      setErrorMessage("Network error executing billing run.");
    } finally {
      setRunningBilling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Invoices
          </h2>
          <p className="text-sm text-slate-500">
            Generated billing statements, recurring payment demands, and invoice states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handlePreviewBilling}
            disabled={previewLoading || runningBilling}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm text-xs h-9 px-3"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {previewLoading ? "Loading preview..." : "Preview billing"}
          </Button>

          <Button
            onClick={handleRunBilling}
            disabled={runningBilling || previewLoading}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm text-xs h-9 px-3"
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            {runningBilling ? "Running billing..." : "Run billing"}
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Invoices Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-100 animate-pulse rounded" />
            <div className="h-10 bg-slate-100 animate-pulse rounded" />
            <div className="h-10 bg-slate-100 animate-pulse rounded" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              No invoices yet
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Invoices will automatically generate when billing cycles come due. You can also run the billing engine above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Number</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Subscription</th>
                  <th scope="col" className="px-6 py-3">Issue Date</th>
                  <th scope="col" className="px-6 py-3">Due Date</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3">State</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((inv) => {
                  const badgeStyle =
                    STATE_BADGES[inv.state] ||
                    "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {inv.number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {inv.customer?.name || "Customer #" + inv.customerId}
                        </div>
                        {inv.customer?.email && (
                          <div className="text-xs text-slate-500">
                            {inv.customer.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {inv.subscription?.number || `#${inv.subscriptionId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(inv.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${badgeStyle}`}
                        >
                          {inv.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/invoices/${inv.id}`}
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

      {/* Preview Dialog Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Billing Run Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Simulated dry run as of {previewData?.asOf ? formatDate(previewData.asOf) : "today"}.
                </p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {previewLoading ? (
                <div className="flex items-center justify-center p-8 text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Calculating billing preview...
                </div>
              ) : previewData?.preview.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No active subscriptions currently due for billing.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200">
                    <span>Due Candidate</span>
                    <span>Billing Period</span>
                    <span className="text-right">Estimated Total</span>
                  </div>

                  {previewData?.preview.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-sm"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {item.wouldCreate
                            ? "Eligible for invoice"
                            : `Skipped (${item.skipped})`}
                        </div>
                        {item.periodStart && item.periodEnd && (
                          <div className="text-xs text-slate-500">
                            {formatDate(item.periodStart)} – {formatDate(item.periodEnd)}
                          </div>
                        )}
                      </div>

                      <div className="text-right font-mono font-medium text-slate-900">
                        {item.grandTotal !== undefined
                          ? formatCurrency(item.grandTotal)
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(false)}
                className="border-slate-200 bg-white text-slate-700"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPreviewOpen(false);
                  handleRunBilling();
                }}
                className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Execute billing run now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification (bottom-right, 4s auto-dismiss) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg animate-in slide-in-from-bottom-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Billing Complete
            </div>
            <div className="text-xs text-slate-600">{toastMessage}</div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
