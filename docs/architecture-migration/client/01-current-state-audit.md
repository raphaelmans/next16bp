# Current State Audit (Baseline)

## Snapshot Metadata

- Captured at: `2026-02-17 22:32:52 PST`
- Repo: `/Users/raphaelm/Documents/Coding/boilerplates/next16bp`
- Scope audited: `src/app`, `src/features`, `src/components`, `src/common`, `src/trpc`

## Baseline Inventory (Measured)

### App Router Footprint

| Metric | Count |
| --- | ---: |
| `page.tsx` files | 94 |
| `layout.tsx` files | 12 |
| `route.ts` files | 12 |
| `loading.tsx` files | 7 |
| `error.tsx` files | 4 |
| `not-found.tsx` files | 0 |
| Non-route files inside `src/app` | 12 |

### Feature Layer Footprint

| Metric | Count |
| --- | ---: |
| Feature modules (`src/features/*`) | 12 |
| `src/features/**/api.ts` | 0 |
| `src/features/**/hooks.ts` | 10 |
| `src/features/**/schemas.ts` | 5 |
| `src/features/**/domain.ts` | 0 |
| `src/features/**/helpers.ts` | 3 |

### Direct tRPC Hook Calls (Current)

| Location | Count |
| --- | ---: |
| `src/app` | 73 |
| `src/features` | 164 |
| `src/components` | 5 |
| Total | 242 |

## Violations Against Target Contract

### 1) Direct tRPC in Route Layer (`src/app`)

Violation: pages are directly calling `trpc.*.useQuery/useMutation` instead of consuming feature query adapters.

Top offenders by direct call count:

1. `src/app/(owner)/owner/bookings/page.tsx` (16)
2. `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` (11)
3. `src/app/(admin)/admin/tools/notification-test/page.tsx` (6)
4. `src/app/(owner-onboarding)/owner/get-started/page.tsx` (4)
5. `src/app/(owner)/owner/courts/[id]/edit/page.tsx` (4)

### 2) Direct tRPC in Shared/Presentation Components

Violation: presentational or shared layout components call transport hooks directly.

Current files:

- `src/components/layout/portal-switcher.tsx`
- `src/components/layout/player-shell.tsx`
- `src/components/health-check.tsx`

### 3) Route-Local Component Files in `src/app`

Violation: non-route modules are still colocated in app routes.

Current list:

- `src/app/home-page-client.tsx`
- `src/app/home-search-form.tsx`
- `src/app/home-tracked-link.tsx`
- `src/app/(public)/courts/courts-page-client.tsx`
- `src/app/(public)/owners/get-started/page-client.tsx`
- `src/app/(public)/places/[placeId]/place-detail-client.tsx`
- `src/app/(public)/places/[placeId]/courts/[courtId]/court-detail-client.tsx`
- `src/app/(public)/poc/google-loc/page-client.tsx`
- `src/app/(admin)/admin/tools/revalidate/actions.ts`
- `src/app/(public)/privacy/page.mdx`
- `src/app/(public)/terms/page.mdx`
- `src/app/.DS_Store`

Notes:

- `page.mdx` files are route files and can remain as routes.
- `.DS_Store` is non-source noise and should be removed.

### 4) Missing Feature API Contracts

Violation: no feature currently exposes `I<Feature>Api` + class + factory boundary.

Evidence:

- `src/features/**/api.ts` count is `0`.

## Hotspot Ranking (Complexity + Call Volume)

### Owner / Admin Hotspots

1. `src/features/owner/hooks.ts` (45 direct tRPC calls)
2. `src/features/admin/hooks.ts` (28 direct tRPC calls)
3. `src/features/owner/components/owner-bookings-import-review-view.tsx` (10)
4. `src/app/(owner)/owner/bookings/page.tsx` (16)
5. `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` (11)

### Chat / Discovery Hotspots

1. `src/features/chat/components/unified-chat/unified-chat-interface.tsx` (8)
2. `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx` (3)
3. `src/features/discovery/hooks.ts` (8)
4. `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` (4)

## Risk Summary

- Highest risk area: owner and admin flows due to large pages + high hook density.
- Secondary risk: chat and discovery widgets embedded in multiple routes.
- Structural risk: lack of `api.ts` boundaries will cause migration churn unless introduced early as no-op contracts.
- Delivery risk: big-bang strategy requires strict freeze, parity gating, and rollback readiness.

## Baseline Freeze Requirements

Before wave execution starts:

1. Record baseline commit SHA and tag it (`baseline/frontend-arch-migration`).
2. Capture current lint status.
3. Export this audit into release notes for parity comparison.
4. Require all migration PRs to include parity notes against this baseline.
