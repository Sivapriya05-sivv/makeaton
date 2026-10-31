"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Repeat,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

interface InvoiceLine {
  id: number;
  description: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  amount: number;
}

interface InvoiceDetail {
  id: number;
  number: string;
  customerId: number;
  subscriptionId: number;
  issueDate: string;
  dueDate: string;
  state: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  amountPaid: number;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  subscription?: {
    id: number;
    number: string;
  };
  lines: InvoiceLine[];
}

const STATE_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200 line-through",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingState, setUpdatingState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        setError("Invoice not found or access forbidden.");
        return;
      }
      setInvoice(await res.json());
    } catch {
      setError("Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handleStateTransition = async (to: string) => {
    setError(null);
    setUpdatingState(to);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to transition invoice state to ${to}.`);
        return;
      }

      await fetchInvoice();
    } catch (err: any) {
      setError(err?.message || "Failed to update state.");
    } finally {
      setUpdatingState(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 rounded-xl border border-rose-200 bg-rose-50 text-center">
        <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-900">Unable to display invoice</h3>
        <p className="text-sm text-rose-700 mt-1">{error || "Invoice not found."}</p>
        <Link href="/invoices">
          <Button variant="outline" className="mt-4 border-slate-200 bg-white">
            Return to Invoices
          </Button>
        </Link>
      </div>
    );
  }

  const balance = invoice.grandTotal - invoice.amountPaid;
  const badgeStyle = STATE_BADGES[invoice.state] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top action bar (hidden during print) */}
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 font-mono">
                {invoice.number}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${badgeStyle}`}
              >
                {invoice.state}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Billing statement for {invoice.customer?.name || `Customer #${invoice.customerId}`}
            </p>
          </div>
        </div>

        {/* State Action Controls & Print */}
        <div className="flex items-center gap-2">
          {invoice.state === "draft" && (
            <Button
              size="sm"
              onClick={() => handleStateTransition("confirmed")}
              disabled={updatingState !== null}
              className="bg-sky-600 text-white hover:bg-sky-700 shadow-sm text-xs h-8 px-3"
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              {updatingState === "confirmed" ? "Confirming..." : "Confirm"}
            </Button>
          )}

          {(invoice.state === "draft" || invoice.state === "confirmed") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStateTransition("cancelled")}
              disabled={updatingState !== null}
              className="border-slate-200 bg-white text-rose-600 hover:bg-rose-50 shadow-sm text-xs h-8 px-3"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              {updatingState === "cancelled" ? "Cancelling..." : "Cancel"}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm text-xs h-8 px-3"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      {/* Main Printable Invoice Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Printable Header Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {invoice.number}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Subscription billing statement
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Billed To:
              </div>
              <div className="font-semibold text-slate-900">
                {invoice.customer?.name || `Customer #${invoice.customerId}`}
              </div>
              <div className="text-sm text-slate-600">
                {invoice.customer?.email}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border capitalize mb-2">
              Status: <span className="font-semibold ml-1">{invoice.state}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 mr-2">Issue Date:</span>
              <span className="font-medium text-slate-900">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 mr-2">Due Date:</span>
              <span className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.subscription?.number && (
              <div className="text-sm">
                <span className="text-slate-500 mr-2">Subscription:</span>
                <span className="font-mono text-slate-900">{invoice.subscription.number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Lines Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Description</th>
                <th scope="col" className="px-4 py-3 text-right">Qty</th>
                <th scope="col" className="px-4 py-3 text-right">Unit Price</th>
                <th scope="col" className="px-4 py-3 text-right">Discount</th>
                <th scope="col" className="px-4 py-3 text-right">Tax</th>
                <th scope="col" className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.lines.map((line, idx) => {
                const taxAmount = (line.amount - line.discountAmount) * line.taxRate;
                const total = line.amount - line.discountAmount + taxAmount;

                return (
                  <tr key={line.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {line.description}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {line.qty}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatCurrency(line.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {line.discountAmount > 0 ? formatCurrency(line.discountAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {line.taxRate > 0 ? `${(line.taxRate * 100).toFixed(0)}%` : "0%"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary Panel (Right aligned) */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <div className="w-full sm:w-80 space-y-2 text-sm">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(invoice.discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between py-1 text-slate-600">
              <span>Tax</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.taxTotal)}</span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-200 text-base font-semibold text-slate-900">
              <span>Grand Total</span>
              <span className="font-mono text-indigo-600">{formatCurrency(invoice.grandTotal)}</span>
            </div>

            <div className="flex justify-between py-1 text-slate-600">
              <span>Amount Paid</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.amountPaid)}</span>
            </div>

            <div className="flex justify-between py-2 border-t border-slate-200 font-semibold text-slate-900">
              <span>Remaining Balance</span>
              <span className={`font-mono ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
