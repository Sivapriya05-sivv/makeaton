"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Percent,
  Plus,
  X,
  Search,
  Check,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TaxItem {
  id: number;
  name: string;
  rate: number;
  appliesTo: string;
  createdAt: Date | string;
}

interface TaxesClientProps {
  initialTaxes: TaxItem[];
  isAdmin: boolean;
}

export function TaxesClient({ initialTaxes, isAdmin }: TaxesClientProps) {
  const router = useRouter();
  const [taxes, setTaxes] = useState<TaxItem[]>(initialTaxes);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [appliesTo, setAppliesTo] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleCreateTax = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const parsedRate = parseFloat(ratePercent);
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      setError("Tax rate must be between 0% and 100%.");
      return;
    }

    if (!name.trim()) {
      setError("Tax name is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rate: parsedRate / 100, // Converts 18 -> 0.18
          appliesTo: appliesTo.trim() || "all",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTaxes((prev) => [data, ...prev]);
        setIsOpen(false);
        setName("");
        setRatePercent("");
        setAppliesTo("all");
        showToast("Tax rate created successfully!");
        router.refresh();
      } else {
        setError(data.error || "Failed to create tax rate.");
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTaxes = taxes.filter(
    (tax) =>
      tax.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tax.appliesTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTaxes = taxes.length;
  const primaryRate = taxes[0] ? `${(taxes[0].rate * 100).toFixed(0)}%` : "0%";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tax Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure regional GST, VAT, and sales tax rules applied to subscription invoice line items.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tax Rate</span>
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Tax Rates</span>
            <Percent className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {totalTaxes}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Configured tax rules</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Primary Rate</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {primaryRate}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Standard regional GST/VAT</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Product Scope</span>
            <Tag className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Global
          </p>
          <span className="text-xs text-slate-400 mt-1 block">Applies to all catalog lines</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search tax rules or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-slate-200 text-sm focus-visible:ring-indigo-600"
          />
        </div>
      </div>

      {/* Tax Rates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredTaxes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Percent className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No tax rates yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "No tax configurations matched your search."
                : "Add your first tax rate to automatically calculate taxes on subscription billing."}
            </p>
            {isAdmin && !searchQuery && (
              <div className="mt-5">
                <Button
                  onClick={() => setIsOpen(true)}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add First Tax Rate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider sticky top-0">
                  <th className="py-3 px-4">Tax Rule Name</th>
                  <th className="py-3 px-4 text-right">Tax Rate (%)</th>
                  <th className="py-3 px-4">Applies To</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTaxes.map((tax) => {
                  const displayPercent =
                    tax.rate <= 1 ? (tax.rate * 100).toFixed(0) : tax.rate.toFixed(0);

                  return (
                    <tr
                      key={tax.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>{tax.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {displayPercent}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {tax.appliesTo === "all" ? "All Products" : tax.appliesTo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {formatDate(tax.createdAt)}
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

      {/* Add Tax Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Add Tax Rate</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-4 pt-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="taxName" className="text-sm font-medium text-slate-700">
                  Tax Name *
                </Label>
                <Input
                  id="taxName"
                  required
                  placeholder="e.g. GST 18%, VAT 5%, State Sales Tax"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                />
                <span className="text-xs text-slate-500 block">
                  Displayed on customer invoice breakdown.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="taxRate" className="text-sm font-medium text-slate-700">
                  Rate Percentage (%) *
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="18"
                  value={ratePercent}
                  onChange={(e) => setRatePercent(e.target.value)}
                  className="border-slate-200 text-sm focus-visible:ring-indigo-600"
                />
                <span className="text-xs text-slate-500 block">
                  e.g. Enter 18 for 18% tax calculation.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="appliesTo" className="text-sm font-medium text-slate-700">
                  Applies To *
                </Label>
                <select
                  id="appliesTo"
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="all">All Catalog Items</option>
                  <option value="software">Software Products</option>
                  <option value="service">Service &amp; Support</option>
                  <option value="addon">Add-ons &amp; Extras</option>
                </select>
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
                  {loading ? "Saving..." : "Add Tax Rate"}
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
