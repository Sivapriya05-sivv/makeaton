# 005: Custom Billing Engine Over Third-Party Billing SaaS

### Context
Brightloop requires custom billing schedules, multi-line catalog plans, flexible close policies (auto vs. pause), tiered variant pricing, and localized GST tax rules.

### Options Considered
- **Third-Party SaaS (Stripe Billing / Chargebee)**: Delegate recurring subscriptions, metered line items, and invoice generation to external APIs.
- **Custom Internal Ledger Engine**: Build `src/engines/billing.ts` with local database control.

### Decision
Build a custom in-house billing engine directly on SQLite/PostgreSQL with Prisma.

### Consequences
- **Pros**: Complete data sovereignty; zero webhook desynchronization or reconciliation latency; no per-transaction vendor fees (0.5%–0.8%); custom close policies without third-party limitations.
- **Cons**: We own currency precision, interval arithmetic edge cases (month-end rollups), and tax calculations internally.
