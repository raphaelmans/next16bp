# AGENTS

## Purpose
Guidance for agentic coding in this repo: commands, style, and conventions.

## Stack Overview
- Next.js 16 App Router + React 19
- TypeScript (strict)
- tRPC + TanStack Query
- Drizzle ORM + Postgres
- Supabase (auth/storage)
- Biome for lint/format
- Tailwind CSS + shadcn/ui patterns

## Commands (pnpm)
Run all commands from repo root.

### Dev / Build
```bash
pnpm dev        # Runs opencode + next dev
pnpm build      # Next.js production build
pnpm start      # Start production server
```

### Lint / Format
```bash
pnpm lint       # biome check
pnpm format     # biome format --write
```

### Database (Drizzle + dotenvx)
```bash
pnpm db:pull       # pull schema from DB
pnpm db:generate   # generate migrations
pnpm db:migrate    # run migrations
pnpm db:push       # push schema to DB
pnpm db:studio     # open drizzle studio
pnpm db:seed       # seed courts
pnpm db:seed:buckets # seed storage buckets
```

### Tests
- No test runner is configured in `package.json` and there are no `*.test.*` / `*.spec.*` files in `src/`.
- If you add a test runner, update this file with the exact single-test command.
- Until then, prefer `pnpm lint` + `pnpm build` for validation.

## Cursor / Copilot Rules
- No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.

## External Instructions (opencode rules)
- When instructions reference files via `@path`, load them with the Read tool only when needed and treat them as mandatory.
- When using the `ui-ux-pro-max` skill, always read `@business-contexts/kudoscourts-design-system.md` before UI changes.
- Use its color palette + typography as the design foundation; extend without overriding core tokens.

## Formatting & Linting
- Biome is the source of truth (`biome.json`).
- 2-space indentation, double quotes, semicolons.
- Let Biome organize imports (`organizeImports` is on).
- Keep changes minimal and avoid reformatting unrelated files.

## Imports
- Use `@/` path alias for `src/` imports (`@/*` → `src/*`).
- Prefer absolute alias imports over long relative paths.
- Group imports by: external → internal alias → relative.

## TypeScript
- `strict: true` is enabled in `tsconfig.json`.
- Avoid `any`; prefer `unknown` with narrowing.
- Export types from Zod schemas (`z.infer` pattern).
- Keep types close to usage and re-use shared DTOs.

## File & Naming Conventions
- File names: kebab-case (`payment-proof.service.ts`).
- React components: PascalCase.
- Hooks: `useX` prefix.
- Types/interfaces: PascalCase.
- Error classes: `<Entity><ErrorType>Error`.
- Error codes: `<MODULE>_<ERROR_TYPE>` in SCREAMING_SNAKE_CASE.

## Frontend Conventions
- App Router lives in `src/app`; add "use client" at the top of client components/hooks.
- Prefer `date-fns` for date formatting (no native `Date` formatting).
- Use `react-hook-form` + `@hookform/resolvers` + Zod for forms.
- Prefer shared formatting helpers in `src/shared/lib/format.ts`.
- Query params: use `nuqs` (`useQueryState` / `useQueryStates`) and avoid manual `router.replace` or `useSearchParams` reconciliation.
- Cache invalidation: use `trpc.useUtils()` helpers; avoid manual query keys for tRPC data (use `QueryClient` only for non-tRPC caches).

## tRPC (React Query Hooks)
- Client: import `trpc` from `@/trpc/client` (created via `createTRPCReact<AppRouter>()`).
- Queries: `trpc.<router>.<procedure>.useQuery(input?, opts?)`.
- Mutations: `trpc.<router>.<procedure>.useMutation({ onSuccess, onError })`, then call `mutate` / `mutateAsync`.
- Parallel queries: `trpc.useQueries((t) => [t.foo.bar(input), ...])`.
- Cache helpers: `const utils = trpc.useUtils()` then `utils.<router>.<procedure>.invalidate(input?)` or `utils.<router>.invalidate()`.
- Avoid legacy APIs: `useTRPC`, `useTRPCClient`, `queryOptions`, `mutationOptions`, and manual tRPC query keys.

## Time Zones (Place-Canonical)
- Production runtimes often run in UTC; always treat `place.timeZone` (IANA) as canonical for booking/availability/pricing.
- Avoid “day math” via `new Date(y, m, d).toISOString()` or `.toISOString().split("T")[0]` (timezone-dependent).
- Use shared helpers:
  - `src/shared/lib/time-zone.ts` for place-local day bounds + weekday/minute-of-day calculations.
  - `src/shared/lib/format.ts` for place-local display (`formatInTimeZone`, `formatTimeInTimeZone`, `formatTimeRangeInTimeZone`).
- UI date picking: pass `timeZone` through to `KudosDatePicker`/`Calendar` so the calendar day is interpreted in the place timezone.
- Validation: run `TZ=UTC pnpm build` (in addition to `pnpm lint`) to catch timezone regressions.


## Backend Architecture (Modules)
`src/modules/<module>/` generally uses this layering:
- `errors/` - domain error classes
- `repositories/` - DB-only access
- `services/` - domain logic + transactions
- `use-cases/` - multi-service orchestration
- `dtos/` - Zod schemas + DTO types
- `<module>.router.ts` - tRPC endpoints
- `factories/` - module factory/wiring

### Repository Rules
- Accept `ctx?: RequestContext`.
- Return `null` for not found.
- No business logic or logging.

### Service Rules
- Accept repository interfaces and `TransactionManager`.
- Pass `ctx` through for reads.
- For writes: use existing `ctx.tx` or open a transaction.
- Log business events using `logger.info({ event: "<entity>.<action>", ... })`.

### Use Case Rules
- Only for multi-service orchestration or side effects.
- Throw domain errors, not generic `Error`.
- External calls outside transactions; side effects after commit.

### Router Rules
- Use `publicProcedure` / `protectedProcedure`.
- Validate input with Zod `.input()`.
- Map `null` returns to domain errors.
- No direct business logic or logging.

## Error Handling
- Base errors live in `src/shared/kernel/errors.ts`.
- All domain errors extend the appropriate base error.
- Error messages must be user-safe and include details in `details`.
- No catching and re-throwing in routers; let formatter handle it.
- tRPC error formatter includes `requestId` and logs:
  - `AppError` → `warn`
  - Unknown errors → `error`

## Logging
- Use structured logging via Pino (see `guides/server/core/logging.md`).
- Business events: `<entity>.<past_tense_action>` (e.g., `user.created`).
- Log request lifecycle (`Request started` / `Request completed`) and include `requestId` in error logs.
- Avoid verbose log messages; keep them short and consistent.

## Validation & DTOs
- Zod schemas for all inputs (`dtos/`).
- Export DTO types via `z.infer` and omit sensitive fields in outputs.

## Data Formatting
- Use helpers in `src/shared/lib/format.ts` and prefer `date-fns` utilities over manual date math.

## Environment & Secrets
- DB scripts expect `.env.local` via `dotenvx`; never commit secrets, service role keys, or `.env.*` files.

## Docs & References
- Server conventions: `guides/server/core/conventions.md`.
- Error handling: `guides/server/core/error-handling.md`.
- Logging: `guides/server/core/logging.md`.
- Date handling: `guides/client/references/12-date-handling.md`.

## Update This File When
- A test runner is added.
- Lint/format tools or scripts change.
- Architecture rules evolve.
