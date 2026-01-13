# Phase 1: Integration Switch (Hook-based tRPC Client)

**Dependencies:** None  
**Parallelizable:** No  
**User Stories:** US-13-01 (partial, invalidation API alignment)  
**Status:** Pending

---

## Objective

Replace the current `@trpc/tanstack-react-query` `createTRPCContext` approach with the hook-based `createTRPCReact` client so the codebase can use:

- `trpc.<router>.<procedure>.useQuery()`
- `trpc.<router>.<procedure>.useMutation()`

without manually calling `useQuery(queryOptions)` or using imperative `trpcClient.*.query/mutate` for routine UI work.

---

## Modules

### Module 1A: Add hook-based client exports

#### Directory Structure

```
src/trpc/
  client.ts
  query-client.ts
src/components/
  providers.tsx
```

#### Implementation Steps

1. Add `@trpc/react-query` dependency.
2. Replace `src/trpc/client.ts` exports to define:
   - `export const trpc = createTRPCReact<AppRouter>()`
   - typed `TRPCClient` factory via `trpc.createClient(...)`
3. Ensure the new `trpc` export is the only supported entrypoint for hooks.

#### Code Example

```ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/shared/infra/trpc/root";

export const trpc = createTRPCReact<AppRouter>();
```

---

### Module 1B: Update app Providers wiring

#### Objective

Rewire `src/components/providers.tsx` to use:

- a singleton `QueryClient` (existing `getQueryClient()` helper)
- `const trpcClient = trpc.createClient({ links: [...] })`
- `<trpc.Provider client={trpcClient} queryClient={queryClient}> ... </trpc.Provider>`

while keeping the existing link behavior:

- JSON calls batched (`httpBatchLink`)
- non-JSON (FormData/File/Blob) routed through `httpLink`

#### Implementation Steps

1. Replace `createTRPCClient<AppRouter>(...)` with `trpc.createClient(...)`.
2. Replace `TRPCProvider` with `trpc.Provider`.
3. Keep `QueryClientProvider` wrapper using the same `queryClient` instance.
4. Confirm `NuqsAdapter` stays as-is.

#### Testing Checklist

- [ ] App compiles (no missing exports)
- [ ] Hook usage is available (`trpc.*.useQuery` exists)

---

## Phase Completion Checklist

- [ ] `trpc` hook client is exported from `src/trpc/client.ts`
- [ ] Providers use `trpc.createClient` and `trpc.Provider`
- [ ] No remaining imports of `TRPCProvider/useTRPC/useTRPCClient` (or they are clearly deprecated and unused)
