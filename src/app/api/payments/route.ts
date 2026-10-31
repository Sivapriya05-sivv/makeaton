import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const createPaymentSchema = z.object({
  invoiceId: z.number().int("invoiceId must be an integer"),
  method: z.enum(["bank", "card", "cash", "upi", "other"]),
  amount: z.number().positive("Amount must be greater than 0"),
  paidOn: z.coerce.date(),
  note: z.string().optional().default(""),
});

function logStateChange(
  invoiceId: number,
  oldState: string,
  newState: string,
  userId?: number
) {
  console.log(
    `[INVOICE_STATE_CHANGE] Invoice #${invoiceId} state changed from '${oldState}' to '${newState}' by userId: ${userId ?? "system"}`
  );
}

export async function GET() {
  try {
    await requireRole("admin", "staff");

    const payments = await prisma.payment.findMany({
      select: {
        id: true,
        invoiceId: true,
        method: true,
        amount: true,
        paidOn: true,
        note: true,
        recordedBy: true,
        createdAt: true,
        invoice: {
          select: {
            id: true,
            number: true,
            grandTotal: true,
            amountPaid: true,
            state: true,
          },
        },
      },
      orderBy: { paidOn: "desc" },
    });

    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireRole("admin", "staff");

    const body = await req.json();
    const validation = createPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { invoiceId, method, amount, paidOn, note } = validation.data;

    // Load invoice, must exist
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // If invoice.state not in ['confirmed','paid'] → 400 'Invoice must be confirmed'
    if (!["confirmed", "paid"].includes(invoice.state)) {
      return NextResponse.json(
        { error: "Invoice must be confirmed" },
        { status: 400 }
      );
    }

    const oldState = invoice.state;

    // Execute atomic transaction for payment and invoice state reconciliation
    const result = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId,
          method,
          amount,
          paidOn,
          note,
          recordedBy: user.id,
        },
      });

      const aggregate = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });

      const sumPayments = aggregate._sum.amount ?? 0;

      // Never allow overpayment above grandTotal to silently drift — clamp and log
      const newPaid = Math.min(sumPayments, invoice.grandTotal);
      if (sumPayments > invoice.grandTotal) {
        console.warn(
          `[PAYMENT_OVERPAYMENT_CLAMPED] Invoice #${invoice.id} received total payments of ${sumPayments}, exceeding grandTotal of ${invoice.grandTotal}. Amount paid clamped to ${invoice.grandTotal}.`
        );
      }

      const newState = newPaid >= invoice.grandTotal ? "paid" : "confirmed";

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          state: newState,
        },
      });

      return { paid: newPaid, state: newState };
    });

    if (result.state !== oldState) {
      logStateChange(invoice.id, oldState, result.state, user.id);
    }

    return NextResponse.json(
      { paid: result.paid, state: result.state },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
