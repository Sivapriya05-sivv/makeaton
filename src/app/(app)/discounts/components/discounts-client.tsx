"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Check, X, AlertCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DiscountItem {
  id: number;
  code: string;
  type: string;
  value: number;
  minPurchase: number;
  minQuantity: number;
  startDate: Date | string;
  endDate: Date | string | null;
  maxUses: number | null;
  usedCount: number;
  scope: string;
  productId: number | null;
  active: boolean;
  createdAt: Date | string;
}

export interface ProductOption {
  id: number;
  name: string;
}

interface DiscountsClientProps {
  initialDiscounts: DiscountItem[];
  products: ProductOption[];
}

export function DiscountsClient({
  initialDiscounts,
  products,
}: DiscountsClientProps) {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<DiscountItem[]>(initialDiscounts);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"fixed" | "percent">("percent");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<"product" | "subscription">("subscription");
  const [productId, setProductId] = useState<string>(
    products[0]?.id ? String(products[0].id) : ""
  );
  const [minPurchase, setMinPurchase] = useState("0");
  const [minQuantity, setMinQuantity] = useState("0");
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleCreateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const valNum = parseFloat(value);
    if (isNaN(valNum) || valNum <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }

    if (type === "percent" && valNum > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    if (scope === "product" && (!productId || parseInt(productId, 10) <= 0)) {
      setError("Please select a product for product-scoped discounts");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: valNum,
          scope,
          productId: scope === "product" ? parseInt(productId, 10) : null,
          minPurchase: parseFloat(minPurchase) || 0,
          minQuantity: parseInt(minQuantity, 10) || 0,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setDiscounts((prev) => [data, ...prev]);
        setIsOpen(false);
        setCode("");
        setType("percent");
        setValue("");
        setScope("subscription");
        setMinPurchase("0");
        setMinQuantity("0");
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setMaxUses("");
        setToastMessage("Discount code created successfully.");
        setTimeout(() => setToastMessage(""), 4000);
        router.refresh();
      } else {
        setError(data.error || "Failed to create discount");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (discount: DiscountItem) => {
    const now = new Date().getTime();
    const start = new Date(discount.startDate).getTime();
    const end = discount.endDate ? new Date(discount.endDate).getTime() : null;

    if (!discount.active) {
      return { label: "Inactive", active: false };
    }

    if (now < start) {
      return { label: "Upcoming", active: false };
    }

    if (end && now > end) {
      return { label: "Expired", active: false };
    }

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return { label: "Exhausted", active: false };
    }

    return { label: "Active", active: true };
  };

  const getProductName = (pId: number | null) => {
    if (!pId) return "—";
    const prod = products.find((p) => p.id === pId);
    return prod ? prod.name : `Product #${pId}`;
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
          Discounts
        </h1>
        <Button
          onClick={() => {
            setError("");
            setIsOpen(true);
          }}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add discount
        </Button>
      </div>

      {/* Table / Empty State */}
      {discounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Tag className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            No discounts yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Create coupon codes or automatic discounts to drive sales and subscriptions.
          </p>
          <div className="mt-6">
            <Button
              onClick={() => {
                setError("");
                setIsOpen(true);
              }}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add discount
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
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Value
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Scope
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Min purchase
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Dates
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-center">
                    Uses (used/max)
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {discounts.map((discount) => {
                  const status = getStatus(discount);
                  return (
                    <tr
                      key={discount.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900 tracking-wide">
                        {discount.code}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
                          {discount.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        {discount.type === "percent"
                          ? `${discount.value}%`
                          : formatCurrency(discount.value)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 capitalize">
                          {discount.scope}
                        </div>
                        {discount.scope === "product" && (
                          <div className="text-xs text-slate-500">
                            {getProductName(discount.productId)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {discount.minPurchase > 0
                          ? formatCurrency(discount.minPurchase)
                          : "None"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap text-xs">
                        <div>From {formatDate(discount.startDate)}</div>
                        {discount.endDate ? (
                          <div>To {formatDate(discount.endDate)}</div>
                        ) : (
                          <div className="text-slate-400">No expiration</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-800">
                        {discount.usedCount} /{" "}
                        {discount.maxUses !== null ? discount.maxUses : "∞"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            status.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {status.active ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-slate-400" />
                          )}
                          <span>{status.label}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Discount Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Add Discount
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscount} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="disc-code" className="text-sm font-medium text-slate-700">
                  Discount code
                </Label>
                <Input
                  id="disc-code"
                  type="text"
                  required
                  disabled={loading}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME20"
                  className="font-mono uppercase border-slate-200 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="disc-type" className="text-sm font-medium text-slate-700">
                    Type
                  </Label>
                  <select
                    id="disc-type"
                    disabled={loading}
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "fixed" | "percent")
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed amount ($)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disc-value" className="text-sm font-medium text-slate-700">
                    Value {type === "percent" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    id="disc-value"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={type === "percent" ? "100" : undefined}
                    required
                    disabled={loading}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "percent" ? "20" : "15.00"}
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="disc-scope" className="text-sm font-medium text-slate-700">
                    Scope
                  </Label>
                  <select
                    id="disc-scope"
                    disabled={loading}
                    value={scope}
                    onChange={(e) =>
                      setScope(e.target.value as "product" | "subscription")
                    }
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    <option value="subscription">Subscription (entire cart)</option>
                    <option value="product">Specific product</option>
                  </select>
                </div>

                {scope === "product" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="disc-product" className="text-sm font-medium text-slate-700">
                      Product
                    </Label>
                    <select
                      id="disc-product"
                      disabled={loading}
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="disc-min-purchase" className="text-sm font-medium text-slate-700">
                    Min purchase ($)
                  </Label>
                  <Input
                    id="disc-min-purchase"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={loading}
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="0.00"
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disc-min-qty" className="text-sm font-medium text-slate-700">
                    Min quantity
                  </Label>
                  <Input
                    id="disc-min-qty"
                    type="number"
                    min="0"
                    disabled={loading}
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    placeholder="0"
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="disc-start-date" className="text-sm font-medium text-slate-700">
                    Start date
                  </Label>
                  <Input
                    id="disc-start-date"
                    type="date"
                    required
                    disabled={loading}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="disc-end-date" className="text-sm font-medium text-slate-700">
                    End date (optional)
                  </Label>
                  <Input
                    id="disc-end-date"
                    type="date"
                    disabled={loading}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="disc-max-uses" className="text-sm font-medium text-slate-700">
                  Max redemption uses (optional)
                </Label>
                <Input
                  id="disc-max-uses"
                  type="number"
                  min="1"
                  disabled={loading}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Leave blank for unlimited"
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
                  {loading ? "Creating..." : "Create Discount"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscountsClient;
