# 006: First-Class Audit Logging for State Transitions

### Context
Fintech and subscription billing systems require non-repudiation and forensic traceability. Updating a subscription from `active` to `closed` or an invoice from `draft` to `confirmed` changes balance sheet liabilities.

### Options Considered
- **In-Place Mutation**: Overwrite the `state` column with the new value; keep no history.
- **CDC / Database Trigger Tables**: Configure database-level WAL triggers to record raw row diffs.
- **Application-Level AuditLog Table**: Record structured transitions (`userId`, `entity`, `entityId`, `fromState`, `toState`, `at`) via `logStateChange()`.

### Decision
Treat state transitions as audited business events logged into an `AuditLog` table on every `PATCH` transition, while ensuring audit failures never crash business operations.

### Consequences
- **Pros**: Complete audit trail showing who transitioned which entity and when; full compliance with financial auditability standards.
- **Cons**: Write overhead for every state change; requires periodic archival policies for high-volume audit tables.
