import { prisma } from "@/lib/prisma";

export interface DiscountModel {
  id: number;
  code: string;
  type: string; // 'fixed' | 'percent'
  value: number;
  minPurchase: number;
  minQuantity: number;
  startDate: Date;
  endDate: Date | null;
  maxUses: number | null;
  usedCount: number;
  scope: string; // 'product' | 'subscription'
  productId: number | null;
  active: boolean;
  createdAt: Date;
}

export type EligibleDiscount = DiscountModel & { appliedAmount: number };

export async function eligibleDiscounts(params: {
  lineSubtotalsByProduct: Record<number, { total: number; qty: number }>;
  totalQty: number;
  totalSubtotal: number;
  asOf: Date;
}): Promise<EligibleDiscount[]> {
  const { lineSubtotalsByProduct, totalQty, totalSubtotal, asOf } = params;

  const all = await prisma.discount.findMany({
    where: { active: true },
  });

  const eligible: EligibleDiscount[] = [];

  for (const discount of all) {
    // 1. startDate <= asOf
    if (new Date(discount.startDate).getTime() > asOf.getTime()) {
      continue;
    }

    // 2. !endDate || endDate >= asOf
    if (discount.endDate && new Date(discount.endDate).getTime() < asOf.getTime()) {
      continue;
    }

    // 3. !maxUses || usedCount < maxUses
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      continue;
    }

    let base = 0;

    // 4. Scope-specific eligibility
    if (discount.scope === "product") {
      if (!discount.productId) {
        continue;
      }

      const prodSubtotal = lineSubtotalsByProduct[discount.productId];
      if (!prodSubtotal) {
        continue;
      }

      if (
        prodSubtotal.qty < discount.minQuantity ||
        prodSubtotal.total < discount.minPurchase
      ) {
        continue;
      }

      base = prodSubtotal.total;
    } else if (discount.scope === "subscription") {
      if (
        totalQty < discount.minQuantity ||
        totalSubtotal < discount.minPurchase
      ) {
        continue;
      }

      base = totalSubtotal;
    } else {
      continue;
    }

    // Compute applied amount:
    // percent → base * value/100; fixed → min(value, base)
    let appliedAmount = 0;
    if (discount.type === "percent") {
      appliedAmount = (base * discount.value) / 100;
    } else if (discount.type === "fixed") {
      appliedAmount = Math.min(discount.value, base);
    }

    appliedAmount = Math.max(0, Math.round(appliedAmount * 100) / 100);

    if (appliedAmount > 0) {
      eligible.push({
        ...discount,
        appliedAmount,
      });
    }
  }

  return eligible;
}

export function distribute<
  T extends {
    productId?: number;
    amount: number;
    discountAmount?: number;
  }
>(
  discount: {
    scope: string;
    productId?: number | null;
    appliedAmount: number;
  },
  lines: T[]
): void {
  const targetLines =
    discount.scope === "product"
      ? lines.filter((l) => l.productId === discount.productId)
      : lines;

  if (targetLines.length === 0 || discount.appliedAmount <= 0) {
    return;
  }

  const base = targetLines.reduce((sum, line) => sum + (line.amount || 0), 0);

  if (base <= 0) {
    return;
  }

  let allocatedTotal = 0;

  for (let i = 0; i < targetLines.length; i++) {
    const line = targetLines[i];
    if (typeof line.discountAmount !== "number") {
      line.discountAmount = 0;
    }

    let share: number;

    if (i === targetLines.length - 1) {
      // Last line absorbs any rounding remainder
      share = Math.round((discount.appliedAmount - allocatedTotal) * 100) / 100;
    } else {
      share =
        Math.round(((line.amount / base) * discount.appliedAmount) * 100) / 100;
      allocatedTotal += share;
    }

    line.discountAmount =
      Math.round((line.discountAmount + share) * 100) / 100;
  }
}
