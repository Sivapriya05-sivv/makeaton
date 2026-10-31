# 001: Modular Monolith Architecture

### Context
Brightloop handles subscription billing, contract management, tax engines, and reporting for high-volume transactions. We needed an architecture that scales with low operational overhead.

### Options Considered
- **Microservices**: Separate auth, billing engine, catalog, and invoice services communicating over gRPC/HTTP.
- **Modular Monolith**: Single Next.js 14 App Router application with clear domain separation in `src/engines/`, `src/lib/`, and `src/app/api/`.

### Decision
Adopt a Modular Monolith in Next.js 14. Core engines (`billing.ts`, `tax.ts`, `audit.ts`) execute in-process with transactional database guarantees via Prisma.

### Consequences
- **Pros**: Zero distributed transaction latency; zero network partition bugs during multi-table billing runs; unified deployment and type safety.
- **Cons**: Requires strict discipline to avoid circular dependencies; horizontal scaling scales the entire unit rather than single worker functions.
