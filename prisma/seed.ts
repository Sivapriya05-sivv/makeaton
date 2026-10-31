import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Wipe all tables in dependency order
  console.log("Cleaning database tables...");
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.subscriptionLine.deleteMany({});
  await prisma.subscription.deleteMany({});
  await (prisma as any).discount.deleteMany({});
  await prisma.plan.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.taxRate.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create users
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  // Admin, Staff, Acme customer
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@brightloop.io",
      passwordHash,
      role: "admin",
    },
  });

  await prisma.user.create({
    data: {
      name: "Staff User",
      email: "staff@brightloop.io",
      passwordHash,
      role: "staff",
    },
  });

  const acme = await prisma.user.create({
    data: {
      name: "Acme Corp",
      email: "acme@customer.io",
      passwordHash,
      role: "customer",
    },
  });

  // 200 demo customers
  const customerData = [];
  for (let i = 1; i <= 200; i++) {
    customerData.push({
      name: `Customer ${i}`,
      email: `c${i}@demo.io`,
      passwordHash,
      role: "customer",
    });
  }

  await prisma.user.createMany({
    data: customerData,
  });

  const allCustomers = await prisma.user.findMany({
    where: { role: "customer" },
    select: { id: true },
  });

  // 3. Create tax rate: GST 18% (appliesTo: 'all')
  console.log("Creating tax rate...");
  const gst = await prisma.taxRate.create({
    data: {
      name: "GST 18%",
      rate: 0.18,
      appliesTo: "all",
    },
  });

  // 4. Create 1 product "Brightloop Suite" (software, ₹1500, cost ₹500) + variants
  console.log("Creating product and variants...");
  const product = await prisma.product.create({
    data: {
      name: "Brightloop Suite",
      type: "software",
      salesPrice: 1500,
      costPrice: 500,
      notes: "Complete enterprise subscription ledger & billing management suite",
      active: true,
      variants: {
        create: [
          { name: "Odoo", priceDelta: 560 },
          { name: "Standard", priceDelta: 0 },
        ],
      },
    },
    include: {
      variants: true,
    },
  });

  const standardVariant = product.variants.find((v) => v.name === "Standard");

  // 5. Create plan "Monthly" (monthly, min qty 1, closePolicy 'auto')
  console.log("Creating plan...");
  const plan = await prisma.plan.create({
    data: {
      name: "Monthly",
      productId: product.id,
      variantId: standardVariant?.id ?? null,
      price: 1500,
      billingInterval: "monthly",
      minQuantity: 1,
      availableFrom: new Date(),
      closePolicy: "auto",
      active: true,
    },
  });

  // 6. Create 3,000 subscriptions for the 200 customers
  console.log("Creating 3,000 active subscriptions...");
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  // Batch insert subscriptions and lines in chunks of 500
  const BATCH_SIZE = 500;
  const TOTAL_SUBS = 3000;

  for (let batchStart = 0; batchStart < TOTAL_SUBS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_SUBS);
    const subBatch = [];

    for (let i = batchStart + 1; i <= batchEnd; i++) {
      const customer = allCustomers[(i - 1) % allCustomers.length];
      subBatch.push({
        id: i,
        number: `SUB-${String(i).padStart(6, "0")}`,
        customerId: customer.id,
        planId: plan.id,
        startDate: yesterday,
        nextBillingDate: yesterday,
        state: "active",
        paused: false,
        paymentTerms: 30,
      });
    }

    await prisma.subscription.createMany({
      data: subBatch,
    });

    const linesBatch = [];
    for (let i = batchStart + 1; i <= batchEnd; i++) {
      const qty = (i % 3) + 1; // qty 1, 2, or 3
      linesBatch.push({
        subscriptionId: i,
        productId: product.id,
        variantId: standardVariant?.id ?? null,
        qty,
        unitPrice: 1500,
        taxId: gst.id,
      });
    }

    await prisma.subscriptionLine.createMany({
      data: linesBatch,
    });
  }

  // 7. Create 1 discount "VOL10"
  console.log("Creating discount...");
  const discountStart = new Date();
  discountStart.setUTCDate(discountStart.getUTCDate() - 30);
  const discountEnd = new Date();
  discountEnd.setUTCDate(discountEnd.getUTCDate() + 60);

  await (prisma as any).discount.create({
    data: {
      code: "VOL10",
      type: "percent",
      value: 10,
      scope: "subscription",
      minPurchase: 2000,
      startDate: discountStart,
      endDate: discountEnd,
      maxUses: 100,
      usedCount: 0,
      active: true,
    },
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
