# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server (Next.js)
pnpm build      # Production build
pnpm lint       # ESLint
pnpm start      # Start production server

# Database (Prisma + PostgreSQL — auth layer only)
npx prisma migrate dev    # Apply migrations in development
npx prisma migrate deploy # Apply migrations in production
npx tsx prisma/seed.ts    # Seed admin user manually
```

No test framework is configured.

## Environment variables

Required in `.env.local`:
```
DATABASE_URL="postgres://..."
BETTER_AUTH_SECRET="<min 32 chars>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

First-run setup: hit `GET /api/setup` once after the DB is migrated — it creates the default admin (`admin@caissepro.com` / `admin123`) if no users exist yet.

## Architecture — hybrid data model

**CaissePro FCFA** is a POS and business management app for African small businesses. It uses two separate data stores:

- **Auth (PostgreSQL via Prisma + better-auth):** User accounts, sessions, and credentials are stored in the database. `better-auth` handles sign-in, sign-out, and session management. The Prisma schema (`prisma/schema.prisma`) defines `User`, `Session`, `Account`, and `Verification` tables.
- **Business data (localStorage):** Products, categories, sales, expenses, customers, cash registers, and store info are all persisted in `localStorage` via `lib/store.ts`. There is no backend API for this data.

### Auth: `lib/auth.ts` + `lib/auth-client.ts`

`lib/auth.ts` configures `better-auth` with the Prisma adapter and the `admin` plugin. `lib/auth-client.ts` exports `authClient` (browser-side) using `createAuthClient` with `adminClient`. The API route `app/api/auth/[...all]/route.ts` delegates all auth HTTP requests to `auth.handler`.

`lib/auth-context.tsx` wraps the app with `AuthProvider`, exposing `useAuth()` → `{ user, login, logout, isLoading }`. It calls `authClient.getSession()` on mount and `authClient.signIn.email()` / `authClient.signOut()` for login/logout. Auth state is server-backed — not localStorage.

### Data layer: `lib/store.ts`

All business CRUD operations go through `lib/store.ts`, which wraps `localStorage` with typed getters/setters. On first load, `initializeStore()` seeds default product categories, expense categories, and store info. It does NOT create the admin user (that happens via `/api/setup`).

`addSale()` automatically decrements product quantities as a side effect of completing a sale. It generates invoice numbers as `FAC-YYYYMMDD-NNNN` based on total sales count.

All store functions guard against SSR with `if (typeof window === 'undefined') return defaultValue`. IDs are generated with `Date.now().toString()`.

`closeCashRegister()` computes totals from *today's* data at close time — be aware of midnight edge cases.

### Route protection: `app/dashboard/layout.tsx`

Client component that checks `useAuth()`. Unauthenticated users see `<LoginForm />` instead of the dashboard. No middleware — protection is purely React-side.

### Pages

All dashboard pages are `'use client'` components that call store functions directly via `useEffect` on mount.

| Route | Purpose |
|---|---|
| `/dashboard` | Summary stats and cash register open/close |
| `/dashboard/pos` | Point of sale — cart, checkout, payment methods |
| `/dashboard/stock` | Product & category management |
| `/dashboard/expenses` | Expense tracking |
| `/dashboard/reports` | Sales/expense charts (Recharts) |
| `/dashboard/invoices` | Invoice list and print |
| `/dashboard/customers` | Customer management with credit balance |
| `/dashboard/users` | User management (admin only) |
| `/dashboard/settings` | Store info (admin only) |

Admin-only routes are enforced in the UI (sidebar hides links, pages check `user.role`). The three roles are `'admin' | 'caissier' | 'gestionnaire'`.

**POS workflow constraint:** `/dashboard/pos` checks `getOpenCashRegister()` on mount and blocks all sales if no register is open. The cash register must be opened from `/dashboard` first.

**Payment methods:** `cash | mobile | card | credit`. Credit sales require selecting a customer; the customer's `balance` field tracks outstanding credit.

### UI components

shadcn/ui components live in `components/ui/`. Path alias `@/*` maps to the project root. To add a new shadcn/ui component: `pnpm dlx shadcn@latest add <component>` (configured via `components.json`, style: new-york, baseColor: neutral).

Use `cn()` from `@/lib/utils` for all className merging — it combines `clsx` and `tailwind-merge`.

Forms use `react-hook-form` + `zod`. Charts use `recharts`. Toast notifications use `sonner`. Theme (dark/light) via `next-themes`. Icons from `lucide-react`.

The app is in French. All UI labels, navigation, and default data use French.

### Build notes

`next.config.mjs` sets `typescript.ignoreBuildErrors: true` — TypeScript errors will not fail `pnpm build`. Always run `pnpm lint` to catch issues the build won't surface. The project uses Tailwind CSS v4 (`@tailwindcss/postcss`).
