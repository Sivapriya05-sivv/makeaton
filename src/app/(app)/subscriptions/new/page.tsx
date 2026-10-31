"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Plan {
  id: number;
  name: string;
  price: number;
  billingInterval: string;
  minQuantity: number;
}

interface Product {
  id: number;
  name: string;
  salesPrice: number;
}

interface Tax {
  id: number;
  name: string;
  rate: number;
}

interface FormLine {
  productId: number;
  qty: number;
  unitPrice: number;
  taxId?: number;
}

export default function NewSubscriptionPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<number | "">("");
  const [planId, setPlanId] = useState<number | "">("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<string>("30");

  const [lines, setLines] = useState<FormLine[]>([
    { productId: 0, qty: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, planRes, prodRes, taxRes] = await Promise.all([
          fetch("/api/users/customers"),
          fetch("/api/plans"),
          fetch("/api/products"),
          fetch("/api/taxes"),
        ]);

        if (custRes.ok) setCustomers(await custRes.json());
        if (planRes.ok) setPlans(await planRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        if (taxRes.ok) setTaxes(await taxRes.json());
      } catch (err) {
        setError("Failed to load prerequisite data.");
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const handleProductChange = (index: number, pId: number) => {
    const product = products.find((p) => p.id === pId);
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              productId: pId,
              unitPrice: product ? product.salesPrice : line.unitPrice,
            }
          : line
      )
    );
  };

  const handleLineChange = (
    index: number,
    field: keyof FormLine,
    value: number | undefined
  ) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, { productId: 0, qty: 1, unitPrice: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!planId) {
      setError("Please select a subscription plan.");
      return;
    }

    if (!startDate) {
      setError("Please select a valid start date.");
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].productId || lines[i].productId === 0) {
        setError(`Please select a product for line ${i + 1}.`);
        return;
      }
      if (lines[i].qty < 1) {
        setError(`Quantity for line ${i + 1} must be at least 1.`);
        return;
      }
      if (lines[i].unitPrice < 0) {
        setError(`Unit price for line ${i + 1} cannot be negative.`);
        return;
      }
    }

    const selectedPlan = plans.find((p) => p.id === Number(planId));
    const totalQty = lines.reduce((sum, line) => sum + Number(line.qty), 0);
    if (selectedPlan && totalQty < selectedPlan.minQuantity) {
      setError(
        `Total quantity (${totalQty}) must meet the plan's minimum of ${selectedPlan.minQuantity}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        customerId: Number(customerId),
        planId: Number(planId),
        startDate: new Date(startDate).toISOString(),
        paymentTerms: paymentTerms ? String(paymentTerms) : undefined,
        lines: lines.map((l) => ({
          productId: Number(l.productId),
          qty: Number(l.qty),
          unitPrice: Number(l.unitPrice),
          taxId: l.taxId ? Number(l.taxId) : undefined,
        })),
      };

      if (expiryDate) {
        payload.expiryDate = new Date(expiryDate).toISOString();
      }

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create subscription.");
        setSubmitting(false);
        return;
      }

      router.push(`/subscriptions/${data.id}`);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
          <div className="h-10 bg-slate-100 animate-pulse rounded" />
          <div className="h-10 bg-slate-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/subscriptions"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              New Subscription
            </h2>
            <p className="text-sm text-slate-500">
              Configure contract parameters, plans, and recurring line items.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h3 className="text-base font-semibold text-slate-900">
            Contract Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) =>
                  setCustomerId(e.target.value ? Number(e.target.value) : "")
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                required
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Only verified customer accounts can hold subscriptions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan">Billing Plan</Label>
              <select
                id="plan"
                value={planId}
                onChange={(e) =>
                  setPlanId(e.target.value ? Number(e.target.value) : "")
                }
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                required
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingInterval} - Min Qty: {p.minQuantity})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Determines billing frequency and minimum quantity thresholds.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                min="0"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Subscription Lines
              </h3>
              <p className="text-sm text-slate-500">
                Add products, service tiers, or add-ons included in this subscription.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add line
            </Button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <select
                    value={line.productId}
                    onChange={(e) =>
                      handleProductChange(idx, Number(e.target.value))
                    }
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                    required
                  >
                    <option value={0}>Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={line.qty}
                    onChange={(e) =>
                      handleLineChange(idx, "qty", Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.unitPrice}
                    onChange={(e) =>
                      handleLineChange(idx, "unitPrice", Number(e.target.value))
                    }
                    required
                  />
                </div>

                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <Label className="text-xs">Tax (Optional)</Label>
                  <select
                    value={line.taxId || ""}
                    onChange={(e) =>
                      handleLineChange(
                        idx,
                        "taxId",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                  >
                    <option value="">No Tax</option>
                    {taxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({(t.rate * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 1}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/subscriptions">
            <Button
              type="button"
              variant="outline"
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          >
            {submitting ? "Creating Subscription..." : "Create Subscription"}
          </Button>
        </div>
      </form>
    </div>
  );
}
