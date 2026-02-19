# Learnings

Append-only.

## 2026-02-19 - Assertion Gate discovery
- Scripts convention: root `package.json` exposes script runners primarily as npm scripts under `db:*`, `script:*`, `lint:arch`, and a single architecture shell gate `scripts/architecture/check-client-conformance.sh`; current quality command is exactly `validate:client-arch = pnpm lint && pnpm lint:arch` at `package.json:12`.
- `tsx` is the project default TS runtime for scripts (`tsx` and `tsx ...` across many entries and docs). `ts-node` and `node --loader` are not referenced in scripts/config here; `typescript` exists as a dev dependency but is not currently imported in existing scripts.
- Existing script location pattern is `scripts/**/*.ts` (data and utility scripts) plus `scripts/architecture/check-client-conformance.sh`; no separate `scripts/quality` directory exists. `scripts` imports project code with relative `../src/...` paths (not `@/` alias).
- Recommended integration: add `lint:assertions`: `tsx scripts/lint-assertions.ts` (or `tsx scripts/architecture/assertion-gate.ts`) and extend `validate:client-arch` to `pnpm lint && pnpm lint:arch && pnpm lint:assertions`. If you want to keep strict minimal risk, run assertions independently and then compose in `validate:client-arch`.
- Conventions to match: tsconfig is TS ESM-style for source (`module: "esnext"`, `moduleResolution: "bundler"`, path alias `@/* -> ./src/*`), but scripts currently use plain ES imports and explicit relative imports to `src/` with Node builtins (`node:fs`, `node:path`).
- Gotcha: because scripts are in repo style, avoid adding `npx tsx` in package scripts if existing pattern is `tsx` or `dotenvx run --env-file=.env.local -- tsx`; this keeps install behavior and runtime consistent.

## 2026-02-19 Feature API hooks usage mapping
- Wrapper module target: `src/common/feature-api-hooks.ts`
- Wrapper exports in module: `createFeatureQueryOptions`, `useFeatureQuery`, `useFeatureMutation`, `useFeatureQueries`, `FeatureMutationResult`, `FeatureMutateFunction`.
- Exported helper casts currently used:
  - `createFeatureQueryOptions`: casts object config to `never`.
  - `useFeatureQuery`: casts options object to `never`, returns `UseQueryResult<TData, AppError>`.
  - `useFeatureMutation`: casts options object to `never`, returns normalized `FeatureMutationResult<TData>`.
  - `useFeatureQueries`: casts `queries as never` and returns `any[]`.
- Imports/usages of `src/common/feature-api-hooks.ts` are in 25 source files (excluding `.next` artifacts).
- Raw call counts (src/features): `useFeatureQuery` 96, `useFeatureMutation` 99, `useFeatureQueries` 5, `createFeatureQueryOptions` 9.
- `useFeatureQueries` callsites: reservation counts, discovery place cards, owner sidebar quick links, owner courts, owner places.
- Highest risk typing hotspots before genericification:
  - Multi-query + derived index access: `src/features/owner/hooks/places.ts`, `src/features/owner/hooks/courts.ts`, `src/features/reservation/hooks.ts` (array mapping over dynamic `map` + indexed lookups + `any[]` return from `useFeatureQueries`).
  - `select` transforms with untyped data: `src/features/owner/hooks/reservations.ts`, `src/features/owner/hooks/place-verification.ts`, `src/features/discovery/hooks/place-detail.ts`.
  - Heavy local casting from query data: `src/features/owner/hooks/places.ts` and `src/features/owner/hooks/organization.ts` (`as OwnerPlaceRecord[]`, `as CourtWithSportPayload[]`, etc.).
  - One callsite passes `as const` on query array input: `src/features/reservation/hooks.ts` (`useFeatureQueries([... ] as const)`) indicates tuple-shape assumptions.
- Constraint patterns to preserve when tightening:
  - options objects are frequently untyped objects that include `enabled`, `staleTime`, `refetchOnWindowFocus`, `refetchInterval`, and `select` (including function signatures over unknown/raw data).
  - query key args are predominantly literal `readonly string[]` tuples, often including nested identifiers and sometimes `organizationId ?? ""` / `placeId || undefined` style input coercion.

## 2026-02-19 - Assertion baseline in src/** (TypeScript assertions)
- Scope: AST scan of all TypeScript files under `src/**` (`.ts`, `.tsx`, `.mts`, `.cts`) using the TypeScript compiler API to avoid comments/strings and nested `as` in prose.
- Total scanned files: 1168
- Files with at least one assertion: 215
- Total assertion hits: 526
- Breakdown:
  - `as any`: 3
  - `as never`: 8
  - `as unknown as` (pattern with intermediate cast to `unknown`): 13
  - `as Record<string, unknown>`: 46
  - `raw as Record<string, unknown>`: 28
  - `<T>expr` assertions: 0
  - `as const`: 144
- Top 20 files by total assertions:
  1. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/common/app-routes.ts — 22
  2. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/bookings-import/services/bookings-import.service.ts — 15
  3. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/open-play/services/open-play.service.ts — 15
  4. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/sitemap.ts — 13
  5. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/chat/providers/stream-chat.provider.ts — 13
  6. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/components/ui/chart.tsx — 11
  7. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/app/api/cron/dispatch-notification-delivery/route.ts — 10
  8. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/discovery/place-detail/components/court-detail-client.tsx — 9
  9. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/components/availability-studio/availability-studio-coordinator.tsx — 9
  10. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/components/bookings-import/bookings-import-review-coordinator.tsx — 9
  11. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/hooks/places.ts — 9
  12. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/storage/dtos/upload.dto.ts — 9
  13. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/shared/infra/ratelimit/config.ts — 9
  14. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/common/feature-api-hooks.ts — 8
  15. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/hooks/reservations.ts — 8
  16. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/place/repositories/place.repository.ts — 8
  17. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/chat/components/chat-widget/reservation-inbox-widget.tsx — 7
  18. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/booking-studio/helpers.ts — 6
  19. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/features/owner/components/booking-studio/draft-row-card.tsx — 6
  20. /Users/raphaelm/Documents/Coding/boilerplates/next16bp/src/lib/modules/chat/services/reservation-chat.service.ts — 6
- Tricky enforcement patterns to include in assertion gate:
  - `raw as Record<string, unknown>` shows up 28 times across API routes; enforce as exact-match sink rule with contextual allow/deny if needed.
  - `as unknown as` chain appears in 8 files (13 occurrences), mostly on parse/validation boundaries.
  - `as const` dominates non-critical assertion load; gate should probably allow/track but not fail them all unless intentionally strict.
## 2026-02-19 - Task 4: callTrpc wrapper call map

- Scope: inspected `src/common/trpc-client-call.ts`, `src/common/feature-api-hooks.ts`, and all `src/features/**/api.ts` call sites.

- Exhaustive call sites found in feature API wrappers: 74 `callTrpcQuery` + 98 `callTrpcMutation` calls (172 total) across 11 files under `src/features` and none outside `/src/features` except the shared helpers.

- All wrapper methods are typed as `(input?: unknown) => Promise<unknown>` and pass `input` through unchanged to wrappers.

- `callTrpcQuery` path + input pattern is uniform: `callTrpcQuery(this.clientApi, <pathArray>, input, this.toAppError)`.

- `callTrpcMutation` path + input pattern is uniform: `callTrpcMutation(this.clientApi, <pathArray>, input, this.toAppError)`.

- Constraint: no dynamic path expression was found in API wrappers; all paths are inline literal arrays.

- Path depth distribution:
  - 2-segment paths: majority (e.g. `['profile','me']`, `['place','list']`, `['supportChat','getClaimSession']`)
  - 3-segment paths: admin and similar deep routers only (e.g. `['admin','court','approve']`, `['admin','notificationDelivery','listMyWebPushSubscriptions']`, `['admin','court','createCuratedBatch']`).

- Files with query wrapper call sites:
  - `src/features/admin/api.ts` (19 queries): `['admin', 'claim', 'approve']`, `['admin', 'claim', 'reject']`, `['admin', 'court', 'activate']`, `['admin', 'court', 'createCurated']`, `['admin', 'court', 'createCuratedBatch']`, `['admin', 'court', 'deactivate']`, `['admin', 'court', 'deletePlace']`, `['admin', 'court', 'recurate']`, `['admin', 'court', 'removePhoto']`, `['admin', 'court', 'transfer']`, `['admin', 'court', 'update']`, `['admin', 'court', 'uploadPhoto']`, `['admin', 'placeVerification', 'approve']`, `['admin', 'placeVerification', 'reject']`, `['admin', 'claim', 'getById']`, `['admin', 'claim', 'getPending']`, `['admin', 'court', 'getById']`, `['admin', 'court', 'list']`, `['admin', 'court', 'stats']`, `['admin', 'placeVerification', 'getById']`, `['admin', 'placeVerification', 'getPending']`, `['sport', 'list']`, `['admin', 'organization', 'search']`, `['admin', 'notificationDelivery', 'dispatchNow']`, `['admin', 'notificationDelivery', 'enqueueReservationCreatedTest']`, `['admin', 'notificationDelivery', 'enqueuePlaceVerificationReviewedTest']`, `['admin', 'notificationDelivery', 'enqueueClaimReviewedTest']`, `['admin', 'notificationDelivery', 'listMyWebPushSubscriptions']`, `['admin', 'notificationDelivery', 'enqueueWebPushTest']`.

  - `src/features/auth/api.ts`: `['auth', 'login']`, `['auth', 'loginWithGoogle']`, `['auth', 'loginWithMagicLink']`, `['auth', 'logout']`, `['auth', 'register']`, `['auth', 'requestEmailOtp']`, `['auth', 'resendSignUpOtp']`, `['auth', 'verifyEmailOtp']`, `['auth', 'verifySignUpOtp']`, `['userPreference', 'setDefaultPortal']`, `['auth', 'me']`, `['organization', 'my']`.

  - `src/features/chat/api.ts`: `['chat', 'getAuth']`, `['chatPoc', 'getAuth']`, `['chatPoc', 'getOrCreateDm']`, `['reservationChat', 'getSession']`, `['reservationChat', 'sendMessage']`, `['reservationChat', 'getThreadMetas']`, `['supportChat', 'backfillClaimThreads']`, `['supportChat', 'sendClaimMessage']`, `['supportChat', 'sendVerificationMessage']`, `['supportChat', 'getClaimSession']`, `['supportChat', 'getVerificationSession']`.

  - `src/features/contact/api.ts`: `['contact', 'submit']`.

  - `src/features/discovery/api.ts`: `['claimRequest', 'submitClaim']`, `['claimRequest', 'submitGuestRemoval']`, `['availability', 'getForCourt']`, `['availability', 'getForCourtRange']`, `['availability', 'getForPlaceSport']`, `['availability', 'getForPlaceSportRange']`, `['court', 'getById']`, `['organization', 'my']`, `['place', 'getByIdOrSlug']`, `['place', 'list']`, `['place', 'listSummary']`, `['sport', 'list']`, `['place', 'cardMediaByIds']`, `['place', 'cardMetaByIds']`.

  - `src/features/health/api.ts`: `['health', 'check']`.

  - `src/features/home/api.ts`: `['organization', 'my']`, `['place', 'stats']`, `['profile', 'me']`, `['reservation', 'getMyWithDetails']`.

  - `src/features/notifications/api.ts`: `['pushSubscription', 'getVapidPublicKey']`; mutations `['pushSubscription', 'revokeMySubscription']`, `['pushSubscription', 'upsertMySubscription']`.

  - `src/features/open-play/api.ts`: `['openPlayChat', 'getSession']`, `['openPlay', 'getDetail']`, `['openPlay', 'getForReservation']`, `['openPlay', 'getPublicDetail']`, `['openPlay', 'listByPlace']`; mutations: `['openPlay', 'cancel']`, `['openPlayChat', 'sendMessage']`, `['openPlay', 'close']`, `['openPlay', 'createFromReservation']`, `['openPlay', 'decideParticipant']`, `['openPlay', 'leave']`, `['openPlay', 'requestToJoin']`.

  - `src/features/organization/api.ts`: `['organization', 'create']`.

  - `src/features/owner/api.ts`: 32 queries + 34 mutations include `['courtHours','get']`, `['courtManagement','getById']`, `['courtManagement','listByPlace']`, `['courtRateRule','get']`, `['organization','get']`, `['organization','my']`, `['organizationPayment','listMethods']`, `['ownerSetup','getStatus']`, `['placeManagement','getById']`, `['placeManagement','list']`, `['placeVerification','getByPlace']`, `['reservationOwner','getForOrganization']`, `['reservationOwner','getPendingCount']`, `['sport','list']`, `['courtBlock','listForCourtRange']`, `['guestProfile','list']`, `['claimRequest','getMy']`, `['claimRequest','getById']`, `['place','list']`, `['place','getById']`, `['bookingsImport','aiUsage']`, `['bookingsImport','getJob']`, `['bookingsImport','listRows']`, `['bookingsImport','listSources']`, `['audit','reservationHistory']` and corresponding mutation paths (`courtHours`, `courtManagement`, `courtRateRule`, `organizationPayment`, `organization`, `placeManagement`, `placeVerification`, `reservationOwner`, `courtBlock`, `guestProfile`, `claimRequest`, `bookingsImport`).

  - `src/features/reservation/api.ts`: `['paymentProof', 'add']`, `['paymentProof', 'upload']`, `['profile', 'update']`, `['profile', 'uploadAvatar']`, `['reservation', 'cancel']`, `['reservation', 'createForAnyCourt']`, `['reservation', 'createForCourt']`, `['reservation', 'markPayment']`, `['profile', 'me']`, `['reservation', 'getById']`, `['reservation', 'getDetail']`, `['reservation', 'getMyWithDetails']`, `['reservation', 'getPaymentInfo']`.

  - `src/features/support-chat/api.ts`: `['supportChat', 'backfillClaimThreads']`, `['supportChat', 'sendClaimMessage']`, `['supportChat', 'sendVerificationMessage']`, `['supportChat', 'getClaimSession']`, `['supportChat', 'getVerificationSession']`.

- `buildTrpcQueryKey` behavior (src/common/feature-api-hooks.ts):
  - Returns `['trpc', ...path]` when `input === undefined`, otherwise `['trpc', ...path, input]`.
  - Used only in `useFeatureQuery` and `createFeatureQueryOptions` to build `queryKey`; no alternative key strategies exist in this module.
  - Stability implication: path shape is stable (literal arrays), so key stability depends on input normalization; when callers pass new object literals (e.g. `{}` in two discovery hooks) keys will include that object and reactivity depends on React Query hash behavior with object inputs.

- `lsp_find_references` was requested but unavailable in the tool set; used `grep` over `/src/features` and targeted hooks files as a reference-graph substitute for exhaustive discovery.



## 2026-02-19 - Typed procedure references (no string dispatch) + stable path keys

- Type-safe procedure invocation from a `createTRPCClient<AppRouter>()` proxy is already supported by the client type: procedures are exposed as a nested record with `query` / `mutate` / `subscribe` methods (see `TRPCClient` + `DecorateProcedure` in tRPC source: https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/packages/client/src/createTRPCClient.ts#L40-L91).
- Under the hood, the proxy collects property access and converts it to a `fullPath` string just before calling the untyped transport (so *call sites* can stay typed and non-string-based): https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/packages/client/src/createTRPCClient.ts#L139-L164.
- Example of the typed call shape we want in our wrappers (no string paths at call sites): `trpc.post.createPost.mutate(...)`, `trpc.post.listPosts.query()`: https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/examples/express-server/src/client.ts#L10-L45.

Concrete wrapper pattern (compatible with keeping our `buildTrpcQueryKey([...path], input)`):

```ts
import type { TRPCClient } from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@/lib/trpc/server' // or wherever; MUST be `import type`

type Inputs = inferRouterInputs<AppRouter>
type Outputs = inferRouterOutputs<AppRouter>

export type TrpcQueryRef<TPath extends readonly string[], TInput, TOutput> = {
  path: TPath
  query: (client: TRPCClient<AppRouter>, input: TInput) => Promise<TOutput>
}

export type TrpcMutRef<TPath extends readonly string[], TInput, TOutput> = {
  path: TPath
  mutate: (client: TRPCClient<AppRouter>, input: TInput) => Promise<TOutput>
}

// Example refs (store path as a const tuple for stable keys)
export const trpcRefs = {
  place_list: {
    path: ['place', 'list'] as const,
    query: (c: TRPCClient<AppRouter>, input: Inputs['place']['list']) => c.place.list.query(input),
  } satisfies TrpcQueryRef<readonly ['place','list'], Inputs['place']['list'], Outputs['place']['list']>,

  reservation_cancel: {
    path: ['reservation', 'cancel'] as const,
    mutate: (c: TRPCClient<AppRouter>, input: Inputs['reservation']['cancel']) => c.reservation.cancel.mutate(input),
  } satisfies TrpcMutRef<readonly ['reservation','cancel'], Inputs['reservation']['cancel'], Outputs['reservation']['cancel']>,
}

// Wrapper stays generic + keeps query keys path-based
export async function callTrpcQueryTyped<TPath extends readonly string[], TInput, TOutput>(
  client: TRPCClient<AppRouter>,
  ref: TrpcQueryRef<TPath, TInput, TOutput>,
  input: TInput,
) {
  return ref.query(client, input)
}

export async function callTrpcMutationTyped<TPath extends readonly string[], TInput, TOutput>(
  client: TRPCClient<AppRouter>,
  ref: TrpcMutRef<TPath, TInput, TOutput>,
  input: TInput,
) {
  return ref.mutate(client, input)
}
```

- This pattern removes *our* dynamic dispatch (no `client.query(pathString, input)` wrapper) while preserving the exact same query-key shape: the path tuple is an explicit constant (`as const`) and is what feeds `buildTrpcQueryKey`.
- `inferRouterInputs` / `inferRouterOutputs` are the canonical helpers for extracting per-procedure input/output types from `AppRouter`: https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/www/docs/client/vanilla/infer-types.md#L45-L75, and their actual type-level implementation lives in server core: https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/packages/server/src/unstable-core-do-not-import/clientish/inference.ts#L34-L60.
- Client files should import the router type with `import type` to avoid server runtime imports (tRPC docs call this out explicitly): https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/www/docs/partials/_import-approuter.mdx#L25-L30.

Optional note:
- If we ever wanted to derive React Query keys from a *procedure reference* (instead of keeping `buildTrpcQueryKey`), tRPC provides `getQueryKey(procedure, input, type)` which reads the procedure's runtime path and builds the key (see source extracting `procedureOrRouter._def().path`): https://github.com/trpc/trpc/blob/feae83843b33e238219ae8e9e97e8b64ce8133c3/packages/react-query/src/internals/getQueryKey.ts#L109-L118.

## 2026-02-19 - TanStack Query v5 typing patterns for generic wrappers (remove `as never` / `as any[]`)

- Prefer passing a single typed options object through to TanStack hooks. When you need to “extract” configs into helper functions, use the official identity helpers `queryOptions()` / `mutationOptions()` so inference is preserved and reusable.
  - `queryOptions()` returns the same options plus a `queryKey` that is *type-tagged* with `DataTag<TQueryKey, TQueryFnData, TError>` (so the key carries the data/error types across `useQuery`, `useQueries`, `prefetchQuery`, etc.). Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/queryOptions.ts#L52-L83
  - `mutationOptions()` is also an identity helper that preserves generics (and has an overload that can require `mutationKey`). Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/mutationOptions.ts#L4-L41
  - React docs explicitly recommend `queryOptions()` / `mutationOptions()` for extracting options while keeping type inference. Evidence: https://github.com/tanstack/query/blob/v5_84_1/docs/framework/react/typescript.md

- `useQueries` is designed for tuple inference and “map” arrays:
  - It accepts `queries: readonly [...QueriesOptions<T>]`, so `as const` tuples produce tuple-typed results (and large arrays avoid TS depth-limit issues). Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/useQueries.ts#L54-L222
  - It includes a fallback branch specifically to infer param types when `queries` comes from `Array.map()` (homogenous array) without needing `as any[]`. Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/useQueries.ts#L163-L185

- `useQueries` option inference is intentionally rich when you *don’t* pass explicit generics:
  - It infers `TQueryFnData` from `queryFn` (via `QueryFunction<infer TQueryFnData, infer TQueryKey>`), infers `TData` from `select`’s return type, and can infer `TError` from `throwOnError`. Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/useQueries.ts#L60-L95

- If you mirror TanStack’s exported types, you don’t need `as never`/`as any[]` in wrappers.

Recommended wrapper type shapes (match our current helper API in `src/common/feature-api-hooks.ts`):

```ts
import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  type QueriesOptions,
  type QueriesResults,
  type UseMutationOptions,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import type { AppError } from '@/common/errors/app-error'
import { buildTrpcQueryKey } from '@/common/trpc-client-call'

export function createFeatureQueryOptions<
  TQueryFnData,
  TInput = unknown,
  TData = TQueryFnData,
>(
  path: readonly string[],
  queryFn: (input?: TInput) => Promise<TQueryFnData>,
  input?: TInput,
  options?: Omit<
    UseQueryOptions<TQueryFnData, AppError, TData, ReturnType<typeof buildTrpcQueryKey>>,
    'queryKey' | 'queryFn'
  >,
) {
  return queryOptions<TQueryFnData, AppError, TData, ReturnType<typeof buildTrpcQueryKey>>({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  })
}

export function useFeatureQuery<
  TQueryFnData,
  TInput = unknown,
  TData = TQueryFnData,
>(
  path: readonly string[],
  queryFn: (input?: TInput) => Promise<TQueryFnData>,
  input?: TInput,
  options?: Omit<
    UseQueryOptions<TQueryFnData, AppError, TData, ReturnType<typeof buildTrpcQueryKey>>,
    'queryKey' | 'queryFn'
  >,
): UseQueryResult<TData, AppError> {
  return useQuery({
    queryKey: buildTrpcQueryKey(path, input),
    queryFn: () => queryFn(input),
    ...(options ?? {}),
  })
}

export function useFeatureMutation<
  TData,
  TVariables = unknown,
  TOnMutateResult = unknown,
>(
  mutationFn: (input: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, AppError, TVariables, TOnMutateResult>,
    'mutationFn'
  >,
) {
  return useMutation<TData, AppError, TVariables, TOnMutateResult>({
    mutationFn,
    ...(options ?? {}),
  })
}

export function useFeatureQueries<T extends Array<any>>(
  queries: readonly [...QueriesOptions<T>],
): QueriesResults<T> {
  return useQueries({ queries })
}
```

Notes:
- `useQuery` generics default to `TData = TQueryFnData` (and `TError = DefaultError` upstream). Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/useQuery.ts#L20-L48
- `useMutation` generics default to `TVariables = void`. Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/useMutation.ts#L19-L27
- `QueriesOptions` / `QueriesResults` are exported from `@tanstack/react-query`. Evidence: https://github.com/TanStack/query/blob/bb257c2835ba12475ac083b10763216280c58e3a/packages/react-query/src/index.ts#L7-L10

## 2026-02-19 - Assertion Gate script: TypeScript Compiler API (AST scan)
- Official starting point (samples + caveats): https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
- Prefer an AST scan (not grep): parse each `.ts` / `.tsx` with `ts.createSourceFile(...)` and walk with `ts.forEachChild(...)`.
- TSX compatibility: pass `scriptKind: ts.ScriptKind.TSX` for `.tsx` so JSX parses correctly (see `ScriptKind.TSX`).
- Assertion nodes to flag:
  - `AsExpression` (the `expr as Type` form)
  - `TypeAssertionExpression` (the `<Type>expr` form; not valid in TSX but valid in `.ts`)

### Evidence (permalinks)
- `AsExpression` / `TypeAssertion` node shapes (kind, `expression`, `type`):
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L5123
- `AssertionExpression = TypeAssertion | AsExpression`:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L5138
- `ts.isAsExpression(...)` and `ts.isTypeAssertionExpression(...)` type guards:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L8872
- `ts.forEachChild(...)` (ordered traversal) + `ts.createSourceFile(...)`:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L9033
- Node helpers used for reporting (e.g. `node.getText(sourceFile?)`):
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L4284
- `SourceFile.getLineAndCharacterOfPosition(pos)` for line/col reporting:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L5865
- `SyntaxKind.TypeAssertionExpression` / `SyntaxKind.AsExpression`:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L3865
- `ScriptKind.TSX`:
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L7051
- `ts.isConstTypeReference(node)` (useful to classify `as const`):
  - https://github.com/microsoft/TypeScript/blob/c8a7d589e647e19c94150d9892909f3aa93e48eb/lib/typescript.d.ts#L8613

### Minimal scan approach (syntax-only)
- For each file (recommended: `git ls-files` for `*.ts` / `*.tsx` and skip `.d.ts`), read text, build `SourceFile`, traverse nodes.
- Report: `file:line:col`, assertion kind (`AsExpression` vs `TypeAssertionExpression`), assertion text (`node.getText(sf)`).
- Classify common patterns by inspecting the assertion `type` node:
  - `as any`: `type.kind === ts.SyntaxKind.AnyKeyword`
  - `as never`: `type.kind === ts.SyntaxKind.NeverKeyword`
  - `as const`: `ts.isConstTypeReference(type)`
  - `as unknown as T`: outer `AsExpression` whose `.expression` is an inner `AsExpression` with `inner.type.kind === UnknownKeyword`

### Performance notes
- Avoid `ts.createProgram()` if you only need syntax (it is much heavier and pulls in tsconfig + dependency graph).
- Use `git ls-files` to naturally exclude `node_modules/`, `.next/`, build output, etc.
- Keep `setParentNodes` off unless you need parent links (faster/less memory).
- For incremental CI: persist a baseline allowlist (e.g. JSON of `{file, classification, snippetHash}`) and fail only when new findings appear.

## 2026-02-19 - Assertion gate implementation landed (`pnpm lint:assertions`)
- Added `scripts/quality/assertion-gate.ts` and `scripts/quality/assertion-baseline.json`, plus `package.json` script: `lint:assertions = tsx scripts/quality/assertion-gate.ts`.
- File enumeration is restricted to tracked/untracked git files under `src/**` using `git ls-files -z --cached --others --exclude-standard -- src`, then filtered to `.ts`, `.tsx`, `.mts` (excluding `.d.ts`); fallback is `ts.sys.readDirectory` on `src/` if git file listing fails.
- Detection is AST-based only (TypeScript compiler API): `AsExpression` and `TypeAssertionExpression` are walked with `ts.forEachChild`, and each finding records `file:line:col`, `classification`, and assertion `nodeText`.
- Classification buckets implemented: `as any`, `as never`, `as unknown as`, `as const`, `as Record<string, unknown>`, `raw as Record<string, unknown>`, and `other`.
- Baseline behavior: if baseline file is missing, script writes one from current findings and exits 0; on subsequent runs it fails only when new non-`as const` findings exceed baseline + optional allowlist entries.
- Baseline matching key is stable and line-independent: SHA-1 hash of `file + classification + normalized node text`; this avoids fragile line-number-only matching.
- Output currently includes totals, classification counts, top 15 files by assertion count, full findings list, and baseline comparison summary (including tracked new `as const` entries).
- Run locally: `pnpm lint:assertions`.

## 2026-02-19 - Shared type guard boundary narrowing
- Added shared `isRecord` in `src/common/type-guards.ts` using strict object checks (`typeof value === "object" && value !== null && !Array.isArray(value)`) and replaced assertion-based record coercion in `src/common/errors/adapters/trpc.ts` with guard-based narrowing while preserving `{}` fallback behavior.

## 2026-02-19 - Assertion cleanup for TRPC error metadata
- Added shared `isRecord` guard in `src/common/type-guards.ts` and reused it in `src/common/errors/adapters/trpc.ts` to remove record assertions while keeping `toTrpcErrorMeta` output identical.

## 2026-02-19 - Stream Chat type augmentation loading
- Added `**/*.d.ts` to `tsconfig.json` include array so Stream Chat module augmentation files like `src/lib/modules/chat/types/stream-chat.d.ts` are picked up by TypeScript.

## 2026-02-19 - Stream Chat custom channel field typing
- Added module augmentation in `src/lib/modules/chat/types/stream-chat.d.ts` with `declare module "stream-chat" { interface CustomChannelData { ... } }`.
- Kept only app-used channel fields (`reservation_id`, `claim_request_id`, `place_verification_request_id`, `open_play_id`, `place_id`) to avoid widening types.
- Verified `tsc` sees the augmentation via `tsconfig.json` `include` containing `"**/*.d.ts"`, then removed the `as unknown as Record<string, unknown>` cast in `ensureReservationChannel` payload creation.

## 2026-02-19 - callTrpc helper generics for typed invokers
- Updated `src/common/trpc-client-call.ts` so `callTrpcQuery` and `callTrpcMutation` are generic over both input and output (`<TInput, TOutput>`), and invokers now return typed procedure functions instead of `(input: unknown)`.
- Feature API wrappers now pass direct dot-access procedure refs (for example `(clientApi) => clientApi.auth.login.mutate`) to remove `procedureInput: any` and eliminate string-literal computed member access while preserving path-based error messages and query-key stability.

## 2026-02-19 - useFeatureMutation contravariance fix
- In `src/common/feature-api-hooks.ts`, removed mutation variable widening (`TVariables | undefined`) from mutation wrappers and switched mutation typing to `TVariables` directly so required-input mutation functions like `(input: X) => Promise<Y>` typecheck.
- `FeatureMutationResult` now derives `mutate`/`mutateAsync` args and returns from TanStack `UseMutationResult` via `Parameters`/`ReturnType`, preserving TanStack v5 arity behavior instead of hand-rolled optional input unions.
- `FeatureMutateFunction` now derives its signature from `UseMutateFunction<...>` with no custom optional-input override, matching TanStack mutation typing surface while keeping runtime mutation forwarding unchanged.

- 2026-02-19: Confirmed `src/features/discovery/place-detail/hooks/use-mobile-week-prefetch.ts` already uses `RouterInputs["availability"]["getForPlaceSportRange"]` / `RouterInputs["availability"]["getForCourt"]` for discovery prefetch inputs; no hook logic changes needed; lint check on this file passes with no issues.

## 2026-02-19 - Task 8 completion: Organization API + hook typing
- Typed `mutOrganizationCreate` in `src/features/organization/api.ts` with `RouterInputs["organization"]["create"]` and `RouterOutputs["organization"]["create"]`, and passed those generics to `callTrpcMutation`.
- Kept invocation style identical with invoker `this.clientApi, ["organization", "create"], (clientApi) => clientApi.organization.create.mutate`.
- Updated `src/features/organization/hooks.ts` cache write to updater form to avoid `any`:
  `utils.organization.my.setData(undefined, (prev) => prev ? [...prev, data.organization] : [data.organization])`.
- Removed all assertion usage (`as any` and `data as ...`) from the touched hook and preserved runtime behavior (`invalidate` + `onSuccess({ id })`).
