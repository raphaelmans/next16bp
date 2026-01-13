# Developer 1 Checklist

**Focus Area:** tRPC client integration + hook refactor  
**Modules:** 1A-4B

---

## Setup

- [ ] Confirm current tRPC client implementation lives in `src/trpc/`.
- [ ] Confirm Providers wiring in `src/components/providers.tsx`.

---

## Module 1A-1B: Integration Switch

- [ ] Add `@trpc/react-query` dependency
- [ ] Export `trpc = createTRPCReact<AppRouter>()` in `src/trpc/client.ts`
- [ ] Replace TRPC provider wiring to use `trpc.createClient` + `trpc.Provider`
- [ ] Keep existing JSON/non-JSON link split behavior

---

## Module 2A: Queries

- [ ] Replace all `queryOptions()` call sites with `trpc.*.useQuery`
- [ ] Replace manual `useQuery({ queryKey, queryFn })` tRPC fetches with `trpc.*.useQuery`
- [ ] Preserve `enabled` gates and retry logic

---

## Module 2B: Mutations

- [ ] Replace all `mutationOptions()` call sites with `trpc.*.useMutation`
- [ ] Replace imperative `useTRPCClient().*.mutate` usage where used for routine UI mutations
- [ ] Ensure file uploads still pass `FormData` correctly

---

## Module 3A: Invalidation

- [ ] Replace tRPC invalidations with `const utils = trpc.useUtils()`
- [ ] Use targeted invalidation with matching input
- [ ] Keep non-tRPC invalidations explicit

---

## Module 4A-4B: Cleanup + Validation

- [ ] Remove deprecated exports and unused imports
- [ ] Remove `@trpc/tanstack-react-query` if unused
- [ ] Run `pnpm lint`
- [ ] Run `pnpm build` and `TZ=UTC pnpm build`

---

## Handoff

- [ ] Update `agent-plans/context.md` changelog
- [ ] Link the new plan folder from the overview if needed
