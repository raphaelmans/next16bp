# Target Architecture Contract

## Objective

Define the final frontend architecture rules that must be true at cutover.

## Final Ownership by Path

| Path | Ownership | Allowed Responsibilities |
| --- | --- | --- |
| `src/app/**` | Next.js route layer | params/searchParams parsing, layout composition, route guards, metadata, route handlers |
| `src/features/<feature>/components/**` | Feature UI layer | business composition + presentation components |
| `src/features/<feature>/hooks.ts` | Query adapter layer | query/mutation definitions, invalidation, composed server-state hooks |
| `src/features/<feature>/api.ts` | Feature API layer | `I<Feature>Api` contract, class implementation, DTO/model mapping, boundary normalization |
| `src/features/<feature>/schemas.ts` | Feature schema layer | zod schemas, parsing, derived types |
| `src/common/**` | Cross-feature client-safe layer | shared route constants, client-safe error contracts, query key contracts, utilities |
| `src/components/**` | Shared UI layer | generic reusable UI and shells |
| `src/trpc/**` | Transport wiring | client/provider/query-client wiring for tRPC + TanStack Query |
| `src/lib/**` | Server-only layer | backend modules, server infra, route handler internals |

## Required Feature Module Contract

Each migrated feature must include:

- `api.ts`
- `hooks.ts`
- `schemas.ts` (if feature handles IO/form contracts)
- `components/` business + presentation split

Preferred optional files:

- `domain.ts` for deterministic domain rules
- `helpers.ts` for pure transforms
- `types.ts` for feature-local non-DTO types

## Allowed Dependency Directions

Allowed:

1. `src/app` -> `src/features` / `src/components` / `src/common`
2. `src/features/components` -> `src/features/hooks` and feature-local presentation components
3. `src/features/hooks` -> `src/features/api` + `@/trpc/client` utilities (during transition) + `src/common`
4. `src/features/api` -> `src/common` + `src/features/schemas` + transport adapters
5. `src/components` -> `src/common` + UI primitives only

Forbidden:

1. `src/app` pages calling `trpc.*.useQuery/useMutation` directly
2. Presentation components calling transport hooks directly
3. `src/components` importing feature-specific query hooks
4. Client code importing server-only modules from `src/lib/**`
5. Query invalidation logic scattered in pages/presentation components

## Next.js App Router Boundary Contract

### Route Layer Rules

- Parse and validate route params in page/layout.
- Parse and normalize search params in page/layout (or route-level helper).
- Pass typed values as props into feature boundaries.
- Keep pages/layouts composition-oriented; avoid embedding transport details.

### Server/Client Component Discipline

- Server Components are default.
- Add `"use client"` only for interactive boundaries.
- Keep client boundaries minimal and local.
- Do not pull server-only modules across a client boundary.

## tRPC Retained Contract

- tRPC remains transport and cache utility foundation.
- `trpc.useUtils()` remains the standard invalidation utility.
- Direct tRPC hook namespaces are not allowed at cutover; feature hooks must call endpoint-scoped `I<Feature>Api` methods.
- Final target: page and presentation layers are transport-agnostic.

## Standardized Public Interfaces

For each feature:

```ts
export interface I<Feature>Api {
  // endpoint-scoped methods
}

export type <Feature>ApiDeps = {
  // transport/client dependencies
  // toAppError normalizer
};

export class <Feature>Api implements I<Feature>Api {
  constructor(private readonly deps: <Feature>ApiDeps) {}
}

export const create<Feature>Api = (deps: <Feature>ApiDeps): I<Feature>Api =>
  new <Feature>Api(deps);
```

## Conformance Criteria (Release-Blocking)

All must pass before cutover:

1. No direct tRPC hook usage in `src/app/**` pages/layouts and presentation components.
2. Every migrated feature has explicit `api.ts` contract.
3. Query/mutation/invalidation behavior is centralized in feature hooks.
4. Route layer non-route files are extracted from `src/app` where applicable.
5. `pnpm lint` and `pnpm lint:arch` pass.
6. Parity matrix passes.
