# Phase 1: Public Navbar Consistency

**Dependencies:** None (standalone)  
**Parallelizable:** Partial  
**User Stories:** US-11-01

---

## Objective

Make public navbar interactions consistent across all public routes by standardizing logo navigation and search routing. Introduce a shared URL query builder helper to reduce ad-hoc query building for public navigation links.

---

## Modules

### Module 1A: URL query builder foundation

**User Story:** `US-11-01`  
**Reference:** `39-00-overview.md`

#### Directory Structure

```
src/shared/lib/url-query-builder.ts
```

#### API

```ts
export type QueryParamRecord = Record<string, string | undefined | null>;

export class URLQueryBuilder {
  static startQuery(searchParams: string): string;
  addParams(values: QueryParamRecord): URLQueryBuilder;
  build(): string;
  buildWithStartQuery(): string;
  buildWholeUrl(url: string): string;
}
```

#### Implementation Steps

1. Add `src/shared/lib/url-query-builder.ts` with the `URLQueryBuilder` class and `QueryParamRecord` type.
2. Keep logic aligned with the Ample repo usage: skip falsy values, return query string, and allow full URL construction.
3. Export `QueryParamRecord` for reuse in navigation helpers.

#### Testing Checklist

- [ ] Typecheck in any consumer modules using the helper.

---

### Module 1B: Navbar search routing updates

**User Story:** `US-11-01`  
**Reference:** `39-00-overview.md`

#### Files

- `src/features/discovery/components/navbar.tsx`
- `src/shared/lib/app-routes.ts` (if route helpers added)

#### UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│ KudosCourts | [Search courts…______________] [List] [Sign In] │
└──────────────────────────────────────────────────────────────┘
```

#### Flow Diagram

```
Public route (any)
  ├─ Click logo ──────▶ / (landing)
  └─ Submit search ───▶ /courts?q=term (filters reset)
```

#### Implementation Steps

1. Update the logo link in `navbar.tsx` to always point at `appRoutes.index.base`.
2. Convert desktop + mobile search forms to GET forms (action + method) and assign `name="q"` to inputs.
3. Update `handleSearch` to use `URLQueryBuilder` for `/courts?q=...` and reset to `/courts` when empty.
4. Ensure the mobile sheet closes after search submit.

#### Code Example

```ts
const query = new URLQueryBuilder().addParams({ q }).build();
router.push(`${appRoutes.courts.base}?${query}`);
```

#### Testing Checklist

- [ ] Search works on `/courts/[id]` and other public routes.
- [ ] Search resets filters to only `q`.
- [ ] Logo click always routes to `/`.

---

## Phase Completion Checklist

- [ ] URLQueryBuilder added to shared lib.
- [ ] Navbar routing consistent across public routes.
- [ ] Lint/build pass.
