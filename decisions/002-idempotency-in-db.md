# 002: Idempotency Enforced via Database Unique Constraints

### Context
Automated recurring billing processes thousands of active subscriptions per run. Retries, concurrent worker threads, and network hiccups must never double-bill a customer.

### Options Considered
- **Application-Level Checks**: Run `findFirst` in Node.js before insert.
- **Distributed Redis Locks**: Acquire a mutex key per subscription-period before generating invoices.
- **Database Composite Unique Constraint**: `@@unique([subscriptionId, billingPeriodStart])` directly on the `Invoice` table.

### Decision
Enforce idempotency at the database layer using `@@unique([subscriptionId, billingPeriodStart])`. If application checks race, the database engine enforces serialization and rejects duplicate generation with `P2002`.

### Consequences
- **Pros**: 100% mathematically race-condition immune across multiple instances; zero Redis infrastructure dependency.
- **Cons**: Write calls must catch unique constraint rejections and handle them gracefully as `{ skipped: 'already_billed' }`.
