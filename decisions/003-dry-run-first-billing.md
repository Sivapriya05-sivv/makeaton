# 003: Dry-Run First Billing Architecture

### Context
Automated billing runs execute irreversible operations that generate legal invoices and trigger downstream payment obligations. Operators require visibility into batch operations before committing mutations.

### Options Considered
- **Direct Run with Compensating Rollbacks**: Run mutations immediately and attempt to void mistakes post-hoc.
- **Staging Clones**: Maintain an out-of-band shadow replica database for simulation.
- **Parametrized Dry-Run Flag**: Implement `{ dryRun: true }` in `billSubscription` exposed via `GET /api/billing/preview`.

### Decision
Build `/api/billing/preview` powered by `opts.dryRun: true` in the core engine before building write operations. Calculation logic between preview and execution is 100% shared code.

### Consequences
- **Pros**: Operators verify candidate counts and revenue projections safely; zero discrepancy between preview calculations and executed invoices.
- **Cons**: Calculations execute twice when preview is confirmed; requires read queries to avoid intermediate writes.
