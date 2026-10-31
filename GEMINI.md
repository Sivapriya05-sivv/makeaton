# Brightloop — Project Guidelines & Rules

## Stack
- Next.js 14 App Router
- TypeScript
- Prisma + SQLite
- Tailwind CSS + shadcn/ui
- JWT cookie auth

## Design Language: Brightloop Ledger
- **Feel**: Professional fintech, calm, dense but breathable
- **Primary Color**: `indigo-600` (`#4F46E5`)
- **Status Colors**:
  - Success: `emerald-600`
  - Danger: `rose-600`
  - Warning: `amber-500`
  - Neutral: `slate`
- **Background**: `slate-50`
- **Cards**: `white` with `rounded-xl`, `shadow-sm`, `border border-slate-200`
- **Sidebar**: `slate-900` bg, `slate-100` text, `indigo-600` active pill
- **Typography**: Inter (system fallback). Headings `font-semibold tracking-tight`
- **Spacing**: Use Tailwind spacing scale, never arbitrary pixel values
- **Tables**: Sticky header (`bg-slate-100`), hover row (`bg-slate-50`), right-align money columns
- **Forms**: Label above input, helper text `slate-500 text-sm`, errors `rose-600 text-sm`
- **Buttons**:
  - Primary: `indigo-600`
  - Secondary: `white` + border
  - Destructive: `rose-600`
- **States**: Never rely on color alone — always pair with text or icon (accessibility)
- **Empty States**: Centered illustration + "No X yet" + primary CTA
- **Loading States**: Skeleton shimmer (never spinners on lists)
- **Toasts**: Bottom-right, 4s auto-dismiss

## UI Rules
- Use `shadcn/ui` components exclusively; do not hand-roll inputs or buttons.
- All money displayed via `formatCurrency()` from `lib/format.ts`.
- All dates displayed as "12 Mar 2025" (via `formatDate`).
- No emojis in the UI. Use `lucide-react` icons only.

## Security Baseline
- **Authentication & Authorization**: All API routes that mutate data must call `currentUser()` FIRST. Return 401 if null, 403 if role not allowed.
- **Server-side Calculation**: Never accept role, price, tax, or discount values from the client. Recompute server-side.
- **Secrets & Logging**: Never log secrets, tokens, or password hashes.
- **Validation**: Validate every input with `zod` before touching the database.
- **Tenant Isolation**: Every DB query that touches customer data must be scoped by `customerId` for `role='customer'`.
