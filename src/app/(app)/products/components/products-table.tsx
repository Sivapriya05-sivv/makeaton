"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Variant {
  id: number;
  productId: number;
  name: string;
  priceDelta: number;
}

export interface Product {
  id: number;
  name: string;
  type: string;
  salesPrice: number;
  costPrice: number;
  notes: string;
  active: boolean;
  createdAt: Date | string;
  variants: Variant[];
}

interface ProductsTableProps {
  initialProducts: Product[];
  isAdmin: boolean;
}

export function ProductsTable({ initialProducts, isAdmin }: ProductsTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Add Product Dialog State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState<"software" | "service" | "addon">("software");
  const [salesPrice, setSalesPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [productError, setProductError] = useState("");
  const [productLoading, setProductLoading] = useState(false);

  // Add Variant Dialog State
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [variantName, setVariantName] = useState("");
  const [priceDelta, setPriceDelta] = useState("");
  const [variantError, setVariantError] = useState("");
  const [variantLoading, setVariantLoading] = useState(false);

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProductError("");
    setProductLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          type: productType,
          salesPrice: parseFloat(salesPrice) || 0,
          costPrice: parseFloat(costPrice) || 0,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) => [{ ...data, variants: [] }, ...prev]);
        setIsAddProductOpen(false);
        setProductName("");
        setProductType("software");
        setSalesPrice("");
        setCostPrice("");
        setNotes("");
        router.refresh();
      } else {
        setProductError(data.error || "Failed to create product");
      }
    } catch {
      setProductError("An unexpected error occurred. Please try again.");
    } finally {
      setProductLoading(false);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProductForVariant) return;

    setVariantError("");
    setVariantLoading(true);

    try {
      const res = await fetch(`/api/products/${selectedProductForVariant.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variantName.trim(),
          priceDelta: parseFloat(priceDelta) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProductForVariant.id
              ? { ...p, variants: [...p.variants, data] }
              : p
          )
        );
        setSelectedProductForVariant(null);
        setVariantName("");
        setPriceDelta("");
        router.refresh();
      } else {
        setVariantError(data.error || "Failed to create variant");
      }
    } catch {
      setVariantError("An unexpected error occurred. Please try again.");
    } finally {
      setVariantLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Products
        </h1>
        {isAdmin && (
          <Button
            onClick={() => setIsAddProductOpen(true)}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add product
          </Button>
        )}
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
            No products yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Get started by adding your first product to your billing catalog.
          </p>
          {isAdmin && (
            <div className="mt-6">
              <Button
                onClick={() => setIsAddProductOpen(true)}
                className="bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add product
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Sales price
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Cost price
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Variants
                  </th>
                  {isAdmin && (
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
                        {product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatCurrency(product.salesPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants.length > 0 ? (
                          product.variants.map((variant) => (
                            <span
                              key={variant.id}
                              className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {variant.name}
                              {variant.priceDelta !== 0 && (
                                <span className="ml-1 text-slate-500">
                                  ({variant.priceDelta > 0 ? "+" : ""}
                                  {formatCurrency(variant.priceDelta)})
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProductForVariant(product);
                            setVariantName("");
                            setPriceDelta("");
                            setVariantError("");
                          }}
                          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs h-8"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add variant
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                Add Product
              </h2>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-name" className="text-sm font-medium text-slate-700">
                  Product name
                </Label>
                <Input
                  id="product-name"
                  type="text"
                  required
                  disabled={productLoading}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Starter Subscription"
                  className="border-slate-200 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-type" className="text-sm font-medium text-slate-700">
                  Type
                </Label>
                <select
                  id="product-type"
                  disabled={productLoading}
                  value={productType}
                  onChange={(e) =>
                    setProductType(
                      e.target.value as "software" | "service" | "addon"
                    )
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="software">Software</option>
                  <option value="service">Service</option>
                  <option value="addon">Addon</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sales-price" className="text-sm font-medium text-slate-700">
                    Sales price ($)
                  </Label>
                  <Input
                    id="sales-price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    disabled={productLoading}
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    placeholder="29.00"
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cost-price" className="text-sm font-medium text-slate-700">
                    Cost price ($)
                  </Label>
                  <Input
                    id="cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={productLoading}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="border-slate-200 focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                  Notes
                </Label>
                <Input
                  id="notes"
                  type="text"
                  disabled={productLoading}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal notes"
                  className="border-slate-200 focus-visible:ring-indigo-600"
                />
              </div>

              {productError && (
                <div className="text-sm text-rose-600" role="alert">
                  {productError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={productLoading}
                  onClick={() => setIsAddProductOpen(false)}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={productLoading}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {productLoading ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Add Variant
                </h2>
                <p className="text-xs text-slate-500">
                  For product: {selectedProductForVariant.name} (Base:{" "}
                  {formatCurrency(selectedProductForVariant.salesPrice)})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForVariant(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVariant} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="variant-name" className="text-sm font-medium text-slate-700">
                  Variant name
                </Label>
                <Input
                  id="variant-name"
                  type="text"
                  required
                  disabled={variantLoading}
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="e.g. Enterprise Tier / Annual Prepay"
                  className="border-slate-200 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="price-delta" className="text-sm font-medium text-slate-700">
                  Price delta ($)
                </Label>
                <Input
                  id="price-delta"
                  type="number"
                  step="0.01"
                  disabled={variantLoading}
                  value={priceDelta}
                  onChange={(e) => setPriceDelta(e.target.value)}
                  placeholder="e.g. 10.00 or -5.00"
                  className="border-slate-200 focus-visible:ring-indigo-600"
                />
                <p className="text-xs text-slate-500">
                  Added to or subtracted from the product&apos;s base sales price.
                </p>
              </div>

              {variantError && (
                <div className="text-sm text-rose-600" role="alert">
                  {variantError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={variantLoading}
                  onClick={() => setSelectedProductForVariant(null)}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={variantLoading}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {variantLoading ? "Adding..." : "Add Variant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsTable;
