import { prisma } from "@/lib/prisma";
import {
  eligibleDiscounts,
  distribute,
  type EligibleDiscount,
} from "@/engines/discount";

export interface BillingLineItem {
  productId: number;
  name: string;
  qty: number;
  unitPrice: number;
  amount: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface GenerateInvoiceParams {
  subscriptionId?: number;
  customerId: number;
  asOf?: Date;
  lines: BillingLineItem[];
}

export async function generateInvoice(params: GenerateInvoiceParams) {
  const asOf = params.asOf ?? new Date();
  const { customerId } = params;

  // Step 6: Line building
  const lines: BillingLineItem[] = params.lines.map((l) => ({
    ...l,
    amount: l.qty * l.unitPrice,
    discountAmount: 0,
    taxAmount: 0,
  }));

  // Step 7: Apply discounts before tax
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const totalSubtotal = lines.reduce((s, l) => s + l.amount, 0);
  const lineSubtotalsByProduct: Record<number, { total: number; qty: number }> =
    {};
  for (const l of lines) {
    lineSubtotalsByProduct[l.productId] ??= { total: 0, qty: 0 };
    lineSubtotalsByProduct[l.productId].total += l.amount;
    lineSubtotalsByProduct[l.productId].qty += l.qty;
  }

  const discounts = await eligibleDiscounts({
    lineSubtotalsByProduct,
    totalQty,
    totalSubtotal,
    asOf,
  });

  let discountTotal = 0;
  for (const d of discounts) {
    distribute(d, lines);
    discountTotal += d.appliedAmount;
  }

  // Step 8: Subtotal
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxableBase = Math.max(0, subtotal - discountTotal);

  // Step 9-11: Tax computation
  const taxes = await prisma.taxRate.findMany();
  let taxTotal = 0;
  for (const line of lines) {
    const lineDiscount = line.discountAmount || 0;
    const lineTaxable = Math.max(0, line.amount - lineDiscount);
    const taxRate = taxes.find((t) => t.appliesTo === "all")?.rate ?? 0;
    const lineTax = Math.round(lineTaxable * taxRate * 100) / 100;
    line.taxAmount = lineTax;
    taxTotal += lineTax;
  }

  // Step 12-13: Grand total
  const grandTotal = Math.max(
    0,
    Math.round((taxableBase + taxTotal) * 100) / 100
  );

  // Step 14: Atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Generate invoice
    const count = await tx.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(5, "0")}`;

    const inv = await tx.invoice.create({
      data: {
        number: invoiceNumber,
        customerId,
        grandTotal,
        amountPaid: 0,
        state: "confirmed",
      },
    });

    // Step 14 (Discounts): Record redemptions and increment usedCount
    for (const d of discounts) {
      await tx.discountRedemption.create({
        data: {
          discountId: d.id,
          invoiceId: inv.id,
          amount: d.appliedAmount,
        },
      });
      await tx.discount.update({
        where: { id: d.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    return {
      invoice: inv,
      lines,
      discounts,
      discountTotal,
      taxTotal,
      grandTotal,
    };
  });

  return result;
}

