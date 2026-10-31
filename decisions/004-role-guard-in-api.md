# 004: Server-Side Authorization Guards on All Mutating API Routes

### Context
Client-side UI components hide administrative controls (such as state transition buttons and subscription creation forms) for regular customers. However, API endpoints can be called directly.

### Options Considered
- **UI-Only Conditional Rendering**: Hide buttons based on JWT token contents in client React components.
- **Middleware-Only Matching**: Path prefix routing in Next.js `middleware.ts`.
- **In-Route Enforcement**: Call `requireRole('admin', 'staff')` as the first instruction inside every API route handler.

### Decision
Enforce authorization explicitly at the route level using `await requireRole(...)` inside every handler, returning immediate `401` or `403` JSON responses.

### Consequences
- **Pros**: Immune to curl/Postman request tampering; role impersonation and customer ID ownership spoofing are rejected at the edge.
- **Cons**: Every endpoint developer must consistently invoke the guard helper; slightly more boilerplate in handlers.
