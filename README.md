# Brightloop

**Brightloop is a subscription billing platform where correctness is demonstrable, not claimed.**

Subscription billing platforms frequently suffer from silent revenue leakage, accidental duplicate charges caused by worker race conditions, and unverifiable state changes. Brightloop solves this by embedding mathematical idempotency constraints at the database layer and enforcing immutable, auditable state transitions across every billing cycle.

---

## The Demo

Follow these steps to verify system correctness in under two minutes:

1. **Log in as Admin & Run Billing**:
   - Navigate to `/login` and sign in with admin credentials (`admin@brightloop.io` / `Admin@123`).
   - Open the **Invoices** page (`/invoices`).
   - Click **Preview billing** to inspect the 3,000 eligible candidate subscriptions in a dry-run modal.
   - Click **Run billing**. Observe that 3,000 invoices are generated.
   - Click **Run billing** a second time. Observe the toast notification: **0 invoices created, 3000 skipped**. The database-level unique constraint prevents duplicate invoice generation even under concurrent execution.

2. **Log in as Customer & Verify Tenant Isolation**:
   - Log out and log back in as customer (`acme@customer.io` / `Admin@123`).
   - Notice that the portal displays only Acme Corp's subscriptions and invoices.
   - Attempting to access another customer's subscription or invoice ID directly via URL or API returns an immediate `403 Forbidden`.

3. **Open Dashboard & Reconcile Numbers**:
   - Log in as admin and view the dashboard metrics.
   - Total billed revenue, taxes collected, and active contract counts reconcile directly with individual ledger lines.

---

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Run database migrations / synchronization
npx prisma migrate dev

# 3. Seed database with initial users, products, taxes, and 3,000 subscriptions
npm run seed

# 4. Start local development server
npm run dev
```

The application will be accessible at `http://localhost:3000`.

---

## Login Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@brightloop.io` | `Admin@123` |
| **Staff** | `staff@brightloop.io` | `Admin@123` |
| **Customer** | `acme@customer.io` | `Admin@123` |

*(Additional 200 demo customer accounts are seeded as `c1@demo.io` through `c200@demo.io` with password `Admin@123`)*

---

## Architecture

- **Billing Engine** (`src/engines/billing.ts`): Idempotent, transaction-wrapped recurring billing cycle generator with dry-run evaluation.
- **Tax Engine** (`src/engines/tax.ts`): Rule-based automated tax calculation matching product types or global defaults.
- **Audit Engine** (`src/lib/audit.ts`): Fault-tolerant forensic state transition audit logger for subscriptions and invoices.
- **Auth & Session Guard** (`src/lib/guard.ts`, `src/lib/auth.ts`): Server-enforced JWT cookie authentication with strict role checks and customer tenancy isolation.

---

## Decisions We Made and Why

- [001-modular-monolith.md](decisions/001-modular-monolith.md) — Why one Next.js app over microservices.
- [002-idempotency-in-db.md](decisions/002-idempotency-in-db.md) — Why the unique constraint lives on the invoice table, not in application code.
- [003-dry-run-first-billing.md](decisions/003-dry-run-first-billing.md) — Why we built `/billing/preview` before `/billing/run`.
- [004-role-guard-in-api.md](decisions/004-role-guard-in-api.md) — Why every mutating route calls `requireRole()`, not just hiding UI buttons.
- [005-why-not-stripe-billing.md](decisions/005-why-not-stripe-billing.md) — Why we built the engine instead of integrating Stripe.
- [006-audit-log-as-first-class.md](decisions/006-audit-log-as-first-class.md) — Why state changes are logged, not just updated.

---

## What We Did NOT Build and Why

1. **Third-Party Payment Gateway Integration (e.g., Stripe Billing)**:
   - *Reason*: Outsourcing billing logic introduces vendor lock-in, recurring revenue fee cuts (0.5%–0.8%), and asynchronous webhook desynchronization risks. Brightloop owns the core ledger and calculation logic directly.
2. **Microservices Architecture**:
   - *Reason*: Splitting a ledger across multiple network boundaries requires two-phase commits or saga orchestration, introducing distributed transaction failure modes. A modular monolith gives atomic transactional integrity without distributed systems overhead.
3. **AI Copilot / Chatbot Overlay**:
   - *Reason*: Financial ledgers require strict deterministic guarantees, mathematical repeatability, and explicit audit trails. Generative AI is non-deterministic and introduces hallucination risks where accuracy is non-negotiable.
