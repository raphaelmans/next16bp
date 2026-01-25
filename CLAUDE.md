# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm start        # Start production server

# Lint/Format (Biome)
pnpm lint         # biome check
pnpm format       # biome format --write

# Database (Drizzle + dotenvx)
pnpm db:generate  # Generate migrations from schema changes
pnpm db:migrate   # Apply migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:seed:sports    # Seed sports data
pnpm db:seed:buckets   # Seed storage buckets

# Scripts
pnpm script:normalize-data  # Run data normalization script
```

No test runner is configured. Use `pnpm lint` + `pnpm build` for validation.

## Stack

- **Framework**: Next.js 16 App Router + React 19
- **Language**: TypeScript (strict mode)
- **API**: tRPC + TanStack Query
- **Database**: Drizzle ORM + PostgreSQL (Supabase)
- **Auth/Storage**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **Linting**: Biome (2-space indent, double quotes, semicolons)

## Architecture

### Source Layout

```
src/
├── app/              # Next.js App Router (route groups: (admin), (auth), (owner), (protected), (public))
├── modules/          # Backend domain modules (repository → service → router pattern)
├── features/         # Frontend feature modules (components, hooks, schemas, helpers)
├── shared/           # Shared infrastructure and utilities
│   ├── infra/        # DB, tRPC, Supabase, rate limiting, logging
│   ├── kernel/       # Core abstractions (errors, context, auth, transactions)
│   └── lib/          # Shared utilities (format.ts, time-zone.ts)
├── components/       # Shared UI components (ui/ for shadcn)
├── trpc/             # tRPC client setup
└── lib/              # Additional shared libraries
```

### Backend Module Structure (`src/modules/<module>/`)

- `errors/` - Domain error classes
- `repositories/` - DB access (accept `ctx?: RequestContext`, return `null` for not found)
- `services/` - Business logic + transactions (use `TransactionManager`)
- `use-cases/` - Multi-service orchestration
- `dtos/` - Zod schemas + inferred types
- `factories/` - Module wiring
- `<module>.router.ts` - tRPC endpoints

### tRPC Router Registration

All routers merge in `src/shared/infra/trpc/root.ts`. Admin routers are nested under `admin.*`.

### Database Schema

Schema files in `src/shared/infra/db/schema/`, exported from `index.ts`. Drizzle config at `drizzle.config.ts`.

## Key Conventions

### Imports

- Use `@/` path alias for `src/` imports
- Group: external → internal alias → relative

### Frontend

- Use `"use client"` directive for client components
- Forms: `react-hook-form` + `@hookform/resolvers` + Zod with StandardForm components in `src/components/form`
- Query params: use `nuqs` (`useQueryState`/`useQueryStates`)
- tRPC client: import from `@/trpc/client`
- Cache invalidation: `trpc.useUtils()` for tRPC, Query Key Factory for non-tRPC

### Backend

- Repositories: no business logic, pass through `ctx` for transaction participation
- Services: own transactions via `TransactionManager`, log business events as `<entity>.<past_tense_action>`
- Routers: use `publicProcedure`/`protectedProcedure`, validate with `.input()`, no direct business logic

### Time Zones

- Always use `place.timeZone` (IANA) as canonical for booking/availability
- Use helpers in `src/shared/lib/time-zone.ts` and `src/shared/lib/format.ts`
- Validate with `TZ=UTC pnpm build` to catch timezone regressions

### Error Handling

- Base errors in `src/shared/kernel/errors.ts`
- Domain errors extend appropriate base error
- Error codes: `<MODULE>_<ERROR_TYPE>` in SCREAMING_SNAKE_CASE

### Naming

- Files: kebab-case (`payment-proof.service.ts`)
- Components: PascalCase
- Hooks: `useX` prefix
- Error classes: `<Entity><ErrorType>Error`

## Environment

Copy `.env.example` to `.env.local`. Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` - Server-side Supabase
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Client-side Supabase

## Documentation References

- Server conventions: `guides/server/core/conventions.md`
- Error handling: `guides/server/core/error-handling.md`
- Logging: `guides/server/core/logging.md`
- Date handling: `guides/client/references/12-date-handling.md`
