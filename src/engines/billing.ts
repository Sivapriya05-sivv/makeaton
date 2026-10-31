import { prisma } from "@/lib/prisma";
import { taxFor } from "@/engines/tax";

export type BillingResult =
  | { skipped: "not_active" }
  | { skipped: "not_due" }
  | { skipped: "already_billed"; invoiceId: number }
  | {
      wouldCreate: true;
      periodStart: Date;
      periodEnd: Date;
      subtotal: number;
      taxTotal: number;
      discountTotal: number;
      grandTotal: number;
    }
  | { created: true; invoiceId: number; grandTotal: number }
  | { error: string; subId?: number };

export function addInterval(
  date: Date,
  interval: "daily" | "weekly" | "monthly" | "yearly"
): Date {
  const result = new Date(date.getTime());
  switch (interval) {
    case "daily":
      result.setUTCDate(result.getUTCDate() + 1);
      break;
    case "weekly":
      result.setUTCDate(result.getUTCDate() + 7);
      break;
    case "monthly":
      result.setUTCMonth(result.getUTCMonth() + 1);
      break;
    case "yearly":
      result.setUTCFullYear(result.getUTCFullYear() + 1);
      break;
  }
  return result;
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;
  const count = await prisma.invoice.count({
    where: {
      number: {
        startsWith: prefix,
      },
    },
  });
  const sequence = String(count + 1).padStart(5, "0");
  return `${prefix}${sequence}`;
}

export async function billSubscription(
  subId: number,
  asOf: Date,
  opts: { dryRun?: boolean } = {}
): Promise<BillingResult> {
  // 1. Load subscription with plan + lines
  const sub = await prisma.subscription.findUnique({
    where: { id: subId },
    include: {
      plan: true,
      lines: true,
    },
  });

  // 2. Return { skipped: 'not_active' } if !sub || state !== 'active' || paused
  if (!sub || sub.state !== "active" || sub.paused) {
    return { skipped: "not_active" };
  }

  // 3. Return { skipped: 'not_due' } if !nextBillingDate || nextBillingDate > asOf
  if (!sub.nextBillingDate || sub.nextBillingDate.getTime() > asOf.getTime()) {
    return { skipped: "not_due" };
  }

  // 4. Calculate period start and period end
  const periodStart = new Date(sub.nextBillingDate);
  const periodEnd = addInterval(
    periodStart,
    sub.plan.billingInterval as "daily" | "weekly" | "monthly" | "yearly"
  );

  // 5. ⭐ IDEMPOTENCY: check existing invoice for subscription + periodStart
  const existing = await prisma.invoice.findUnique({
    where: {
      subscriptionId_billingPeriodStart: {
        subscriptionId: sub.id,
        billingPeriodStart: periodStart,
      },
    },
  });

  if (existing) {
    return { skipped: "already_billed", invoiceId: existing.id };
  }

  // 6. Build line objects from sub.lines
  // 7. For each line fetch tax
  // 8. Calculate subtotal
  // 9. (Phase 6 will add discounts here — TODO: add discounts here)
  // 10. Calculate tax amounts and totals
  const discountTotal = 0;
  let subtotal = 0;
  let taxTotal = 0;

  const processedLines = [];
  for (const line of sub.lines) {
    const qty = line.qty;
    const unitPrice = line.unitPrice;
    const amount = qty * unitPrice;
    const discountAmount = 0; // TODO: Phase 6 will add line discounts

    const tax = line.productId
      ? await taxFor(line.productId)
      : { rate: 0, taxId: null };
    const taxRate = tax.rate;
    const taxId = tax.taxId;
    const taxAmount = (amount - discountAmount) * taxRate;

    subtotal += amount;
    taxTotal += taxAmount;

    processedLines.push({
      productId: line.productId ?? null,
      description: `${qty} × product#${line.productId}`,
      qty,
      unitPrice,
      amount,
      taxRate,
      taxId,
      discountAmount,
    });
  }

  const grandTotal = subtotal - discountTotal + taxTotal;

  // 11. If opts.dryRun → return wouldCreate summary
  if (opts.dryRun) {
    return {
      wouldCreate: true,
      periodStart,
      periodEnd,
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
    };
  }

  // 12. Number generation
  const invoiceNumber = await nextInvoiceNumber();

  // 13. dueDate = asOf + plan/paymentTerms days
  const termDays = sub.paymentTerms ? parseInt(String(sub.paymentTerms), 10) : 0;
  const dueDate = new Date(asOf.getTime());
  dueDate.setUTCDate(dueDate.getUTCDate() + (isNaN(termDays) ? 0 : termDays));

  // 14. Transaction: create invoice + lines and update subscription
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          issueDate: asOf,
          dueDate,
          state: "draft",
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          amountPaid: 0,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          lines: {
            create: processedLines.map((line) => ({
              productId: line.productId,
              description: line.description,
              qty: line.qty,
              unitPrice: line.unitPrice,
              taxId: line.taxId,
              taxRate: line.taxRate,
              discountAmount: line.discountAmount,
              amount: line.amount,
            })),
          },
        },
        select: {
          id: true,
        },
      });

      const shouldClose =
        sub.plan?.closePolicy === "auto" &&
        sub.expiryDate !== null &&
        sub.expiryDate !== undefined &&
        periodEnd.getTime() > new Date(sub.expiryDate).getTime();

      const subUpdateData: any = {
        nextBillingDate: shouldClose ? null : periodEnd,
      };
      if (shouldClose) {
        subUpdateData.state = "closed";
      }

      await tx.subscription.update({
        where: { id: sub.id },
        data: subUpdateData,
      });

      return invoice;
    });

    // 15. Return { created: true, invoiceId, grandTotal }
    return { created: true, invoiceId: result.id, grandTotal };
  } catch (error: any) {
    // If concurrent race condition occurs on unique constraint:
    if (
      error?.code === "P2002" ||
      error?.message?.includes("Unique constraint")
    ) {
      const raceExisting = await prisma.invoice.findUnique({
        where: {
          subscriptionId_billingPeriodStart: {
            subscriptionId: sub.id,
            billingPeriodStart: periodStart,
          },
        },
      });
      if (raceExisting) {
        return { skipped: "already_billed", invoiceId: raceExisting.id };
      }
    }
    throw error;
  }
}

export async function runBilling(asOf: Date): Promise<{
  processed: number;
  created: number;
  skipped: number;
  errors: number;
  details: BillingResult[];
}> {
  const due = await prisma.subscription.findMany({
    where: {
      state: "active",
      paused: false,
      nextBillingDate: { lte: asOf },
    },
    orderBy: {
      id: "asc",
    },
  });

  let processed = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;
  const details: BillingResult[] = [];

  for (const sub of due) {
    processed++;
    try {
      const result = await billSubscription(sub.id, asOf);
      details.push(result);
      if ("created" in result && result.created) {
        created++;
      } else if ("skipped" in result) {
        skipped++;
      }
    } catch (err: any) {
      errors++;
      details.push({
        error: err?.message || "Unknown error during subscription billing",
        subId: sub.id,
      });
    }
  }

  return {
    processed,
    created,
    skipped,
    errors,
    details,
  };
}
