# Phase 2: Hooks Refactor (Queries + Mutations)

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial (queries vs mutations can be split)  
**User Stories:** US-13-01 (for invalidation touchpoints)  
**Status:** Pending

---

## Objective

Refactor all client components and hooks to stop using:

- `useTRPC()` + `useQuery(trpc.*.queryOptions(...))`
- `useTRPCClient()` + manual `useQuery({ queryKey, queryFn })`
- `useMutation(trpc.*.mutationOptions(...))`

and instead use:

- `trpc.<router>.<procedure>.useQuery(input?, opts?)`
- `trpc.<router>.<procedure>.useMutation(opts?)`

---

## Modules

### Module 2A: Convert queries

#### Target patterns

1. Replace:

```ts
const trpc = useTRPC();
const q = useQuery(trpc.organization.my.queryOptions());
```

with:

```ts
const q = trpc.organization.my.useQuery();
```

2. Replace dependent queries:

```ts
const placeQuery = trpc.placeManagement.getById.useQuery(
  { placeId },
  { enabled: !!placeId },
);
```

3. Replace manual queryKey/queryFn usage:

```ts
useQuery({
  queryKey: ["owner-places", organizationId],
  queryFn: () => trpcClient.placeManagement.list.query({ organizationId }),
  enabled: !!organizationId,
});
```

with the hook for the underlying procedure and a `select` mapper when needed.

#### Implementation Steps

1. Search and replace all `queryOptions()` call sites.
2. Replace each with `trpc.<router>.<procedure>.useQuery(...)`.
3. Where the previous code mapped data (e.g. `mapOwnerPlace`), migrate mapping into:
   - `select` option on `useQuery`, or
   - a derived `useMemo` based on `query.data`
4. Preserve `enabled`, `retry`, and other options as close as possible.

---

### Module 2B: Convert mutations

#### Target patterns

1. Replace:

```ts
const trpc = useTRPC();
return useMutation(trpc.auth.logout.mutationOptions());
```

with:

```ts
return trpc.auth.logout.useMutation();
```

2. Replace imperative `.mutateAsync` calls on `useTRPCClient()` (when used for standard mutations) with:

- `const mutation = trpc.router.proc.useMutation({ onSuccess })`
- `await mutation.mutateAsync(input)`

3. Ensure FormData / file uploads remain supported:

- Keep using mutation inputs as `FormData` where applicable.
- Preserve link split behavior from Phase 1.

#### Implementation Steps

1. Search and replace all `mutationOptions()` call sites.
2. Replace each with `trpc.<router>.<procedure>.useMutation(...)`.
3. Ensure all calling code continues to use `mutate`, `mutateAsync`, and loading states (`isPending`).

---

## Phase Completion Checklist

- [ ] No remaining `queryOptions()` usage
- [ ] No remaining `useQuery(trpc.*.queryOptions(...))` usage
- [ ] No remaining `mutationOptions()` usage
- [ ] No remaining `useMutation(trpc.*.mutationOptions(...))` usage
- [ ] All existing `enabled` gates preserved
