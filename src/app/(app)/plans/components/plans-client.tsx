"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  X,
  Search,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PlanVariant {
  id: number;
  productId: number;
  name: string;
  priceDelta: number;
}

export interface PlanProduct {
  id: number;
  name: string;
  type: string;
  variants: PlanVariant[];
}

export interface PlanItem {
  id: number;
  name: string;
  productId: number;
  productName?: string;
  variantId: number | null;
  variantName?: string | null;
  price: number;
  billingInterval: string;
  minQuantity: number;
  availableFrom: Date | string;
  availableTo: Date | string | null;
  closePolicy: string;
  active: boolean;
  createdAt: Date | string;
  product?: {
    id: number;
    name: string;
  };
}

interface PlansClientProps {
  initialPlans: PlanItem[];
  products: PlanProduct[];
  isAdmin: boolean;
}

export function PlansClient({
  initialPlans,
  products,
  isAdmin,
}: PlansClientProps) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [searchQuery, setSearchQuery] = useState("");
  const [intervalFilter, setIntervalFilter] = useState<string>("all");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id ? String(products[0].id) : ""
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [billingInterval, setBillingInterval] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [minQuantity, setMinQuantity] = useState("1");
  const [closePolicy, setClosePolicy] = useState<
    "auto" | "early" | "pause" | "renew"
  >("auto");
  const [availableFrom, setAvailableFrom] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [availableTo, setAvailableTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Find variants for currently selected product
  const currentProduct = products.find(
    (p) => p.id === parseInt(selectedProductId, 10)
  );
  const availableVariants = currentProduct?.variants || [];

  const handleProductChange = (newProductId: string) => {
    setSelectedProductId(newProductId);
    setSelectedVariantId("");
  };

  const handleCreatePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Price must be a valid number greater than or equal to 0.");
      return;
    }

    const prodId = parseInt(selectedProductId, 10);
    if (!prodId || isNaN(prodId)) {
      setError("Please select a product.");
      return;
    }

    const varId = selectedVariantId ? parseInt(selectedVariantId, 10) : null;
    const parsedMinQty = parseInt(minQuantity, 10) || 1;

    if (availableTo && new Date(availableTo) <= new Date(availableFrom)) {
      setError("Available To date must be after Available From date.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          productId: prodId,
          variantId: varId,
          price: parsedPrice,
          billingInterval,
          minQuantity: parsedMinQty,
          availableFrom: new Date(availableFrom).toISOString(),
          availableTo: availableTo ? new Date(availableTo).toISOString() : null,
          closePolicy,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Find product name and variant name for optimistic display
        const prod = products.find((p) => p.id === prodId);
        const vari = prod?.variants.find((v) => v.id === varId);

        const newPlan: PlanItem = {
          ...data,
          productName: prod?.name || "",
          variantName: vari?.name || null,
          product: prod ? { id: prod.id, name: prod.name } : undefined,
        };

        setPlans((prev) => [newPlan, ...prev]);
        setIsOpen(false);
        // Reset form
        setName("");
        setPrice("");
        setMinQuantity("1");
        setAvailableTo("");
        setSelectedVariantId("");
        showToast("Plan created successfully!");
        router.refresh();
      } else {
        setError(data.error || "Failed to create plan.");
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.productName || plan.product?.name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesInterval =
      intervalFilter === "all" || plan.billingInterval === intervalFilter;
    return matchesSearch && matchesInterval;
  });

  // KPI aggregates
  const totalPlans = plans.length;
  const monthlyPlans = plans.filter((p) => p.billingInterval === "monthly").length;
  const yearlyPlans = plans.filter((p) => p.billingInterval === "yearly").length;
  const avgPrice =
    totalPlans > 0
      ? plans.reduce((acc, curr) => acc + curr.price, 0) / totalPlans
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Plans &amp; Pricing
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure subscription pricing tiers, billing cycles, and auto-close policies.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Plan</span>
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Total Plans</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalPlans}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Active catalog plans</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Monthly Plans</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {monthlyPlans}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Billed every 30 days</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Yearly Plans</span>
            <Calendar className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {yearlyPlans}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Billed annually</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Average Price</span>
            <Tag className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrency(avgPrice)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Across all active tiers</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search plans or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 text-sm focus-visible:ring-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Cycle:</span>
          <select
            value={intervalFilter}
            onChange={(e) => setIntervalFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="all">All Intervals</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPlans.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No plans yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || intervalFilter !== "all"
                ? "No subscription plans matched your filter criteria."
                : "Create your first plan to define subscription pricing and billing intervals."}
            </p>
            {isAdmin && !searchQuery && intervalFilter === "all" && (
              <div className="mt-5">
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create First Plan
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Product &amp; Variant</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4">Billing Interval</th>
                  <th className="py-3 px-4 text-center">Min Qty</th>
                  <th className="py-3 px-4">Close Policy</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPlans.map((plan) => {
                  const prodName = plan.productName || plan.product?.name || "Product";
                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>{plan.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>{prodName}</span>
                          {plan.variantName && (
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                              {plan.variantName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                        {formatCurrency(plan.price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                            plan.billingInterval === "monthly"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : plan.billingInterval === "yearly"
                              ? "bg-violet-50 text-violet-700 border-violet-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          {plan.billingInterval}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {plan.minQuantity}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono capitalize">
                          {plan.closePolicy}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(plan.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Plan Dialog Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Create Subscription Plan</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 pt-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="planName" className="text-sm font-medium text-slate-700">
                  Plan Name *
                </Label>
                <Input
                  id="planName"
                  required
                  placeholder="e.g. Standard Monthly, Enterprise Yearly"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="planProduct" className="text-sm font-medium text-slate-700">
                    Product *
                  </Label>
                  <select
                    id="planProduct"
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="planVariant" className="text-sm font-medium text-slate-700">
                    Variant (Optional)
                  </Label>
                  <select
                    id="planVariant"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    disabled={availableVariants.length === 0}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
                  >
                    <option value="">No Variant (Default)</option>
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (+{formatCurrency(v.priceDelta)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="planPrice" className="text-sm font-medium text-slate-700">
                    Recurring Price (USD) *
                  </Label>
                  <Input
                    id="planPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="1500.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="planInterval" className="text-sm font-medium text-slate-700">
                    Billing Interval *
                  </Label>
                  <select
                    id="planInterval"
                    value={billingInterval}
                    onChange={(e) =>
                      setBillingInterval(
                        e.target.value as "daily" | "weekly" | "monthly" | "yearly"
                      )
                    }
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="minQuantity" className="text-sm font-medium text-slate-700">
                    Minimum Quantity *
                  </Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="1"
                    required
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="closePolicy" className="text-sm font-medium text-slate-700">
                    Close Policy *
                  </Label>
                  <select
                    id="closePolicy"
                    value={closePolicy}
                    onChange={(e) =>
                      setClosePolicy(
                        e.target.value as "auto" | "early" | "pause" | "renew"
                      )
                    }
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="auto">Auto (Close at expiry)</option>
                    <option value="early">Early (Immediate close)</option>
                    <option value="pause">Pause (Hold billing)</option>
                    <option value="renew">Renew (Auto-renew cycle)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="availableFrom" className="text-sm font-medium text-slate-700">
                    Available From *
                  </Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    required
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="availableTo" className="text-sm font-medium text-slate-700">
                    Available To (Optional)
                  </Label>
                  <Input
                    id="availableTo"
                    type="date"
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {loading ? "Creating..." : "Save Plan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
