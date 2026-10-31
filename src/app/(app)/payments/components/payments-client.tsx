"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet, Check, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PaymentItem {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  customerName: string;
  method: string;
  amount: number;
  paidOn: Date | string;
  note: string;
}

export interface ConfirmedInvoice {
  id: number;
  number: string;
  customerName: string;
  grandTotal: number;
  amountPaid: number;
  remaining: number;
}

interface PaymentsClientProps {
  initialPayments: PaymentItem[];
  confirmedInvoices: ConfirmedInvoice[];
}

export function PaymentsClient({
  initialPayments,
  confirmedInvoices,
}: PaymentsClientProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [invoices, setInvoices] = useState<ConfirmedInvoice[]>(confirmedInvoices);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    confirmedInvoices[0]?.id ? String(confirmedInvoices[0].id) : ""
  );
  const [method, setMethod] = useState<"bank" | "card" | "cash" | "upi" | "other">("bank");
  const [amount, setAmount] = useState<string>(
    confirmedInvoices[0]?.remaining ? String(confirmedInvoices[0].remaining) : ""
  );
  const [paidOn, setPaidOn] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleInvoiceChange = (invIdStr: string) => {
    setSelectedInvoiceId(invIdStr);
    const selectedInv = invoices.find((inv) => String(inv.id) === invIdStr);
    if (selectedInv) {
      setAmount(String(selectedInv.remaining));
    }
  };

  const handleOpenDialog = () => {
    if (invoices.length > 0) {
      const defaultInv = invoices[0];
      setSelectedInvoiceId(String(defaultInv.id));
      setAmount(String(defaultInv.remaining));
    } else {
      setSelectedInvoiceId("");
      setAmount("");
    }
    setPaidOn(new Date().toISOString().split("T")[0]);
    setNote("");
    setError("");
    setIsOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const invIdNum = parseInt(selectedInvoiceId, 10);
    const amountNum = parseFloat(amount);

    if (isNaN(invIdNum) || !invIdNum) {
      setError("Please select an invoice.");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invIdNum,
          method,
          amount: amountNum,
          paidOn: new Date(paidOn).toISOString(),
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsOpen(false);
        const isInvoiceMarkedPaid = data.state === "paid";
        setToastMessage(
          isInvoiceMarkedPaid
            ? "Payment recorded. Invoice marked paid."
            : "Payment recorded successfully."
        );

        setTimeout(() => {
          setToastMessage("");
        }, 4000);

        router.refresh();
      } else {
        setError(data.error || "Failed to record payment.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Payments
        </h1>
        <Button
          onClick={handleOpenDialog}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Record payment
        </Button>
      </div>

      {/* Table / Empty State */}
      {payments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Wallet className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            No payments yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Payments collected for confirmed invoices will appear here.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleOpenDialog}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Record payment
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(payment.paidOn)}
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      {payment.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {payment.customerName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                      {payment.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Record Payment
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-600">
                  There are no confirmed invoices with remaining balances to pay.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="invoice-select" className="text-sm font-medium text-slate-700">
                    Invoice
                  </Label>
                  <select
                    id="invoice-select"
                    required
                    disabled={loading}
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number} — {inv.customerName} ({formatCurrency(inv.remaining)} remaining)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="payment-method" className="text-sm font-medium text-slate-700">
                      Payment method
                    </Label>
                    <select
                      id="payment-method"
                      disabled={loading}
                      value={method}
                      onChange={(e) =>
                        setMethod(
                          e.target.value as
                            | "bank"
                            | "card"
                            | "cash"
                            | "upi"
                            | "other"
                        )
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="bank">Bank transfer</option>
                      <option value="card">Card</option>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                      Amount ($)
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      disabled={loading}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="border-slate-200 focus-visible:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="paid-on" className="text-sm font-medium text-slate-700">
                    Payment date
                  </Label>
                  <Input
                    id="paid-on"
                    type="date"
                    required
                    disabled={loading}
                    value={paidOn}
                    onChange={(e) => setPaidOn(e.target.value)}
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-sm font-medium text-slate-700">
                    Note (optional)
                  </Label>
                  <Input
                    id="note"
                    type="text"
                    disabled={loading}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Reference, transaction ID, or check number"
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>

                {error && (
                  <div className="text-sm text-rose-600" role="alert">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {loading ? "Recording..." : "Record Payment"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentsClient;
