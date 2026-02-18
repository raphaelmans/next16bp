# Route Layer Extraction Plan (`src/app` Cleanup)

## Purpose

Extract legacy route-local modules from `src/app` so route files are composition boundaries only.

## Source -> Target Mapping

### Files to Move

| Current Path | Target Path | Notes |
| --- | --- | --- |
| `src/app/home-page-client.tsx` | `src/features/home/components/home-page-client.tsx` | Keep page-level composition in `src/app/page.tsx` |
| `src/app/home-search-form.tsx` | `src/features/home/components/home-search-form.tsx` | Imported by home route/client wrapper |
| `src/app/home-tracked-link.tsx` | `src/features/home/components/home-tracked-link.tsx` | Keep telemetry behavior unchanged |
| `src/app/(public)/courts/courts-page-client.tsx` | `src/features/discovery/components/courts-page-client.tsx` | Route remains in page file |
| `src/app/(public)/owners/get-started/page-client.tsx` | `src/features/owner/components/owner-get-started-page-client.tsx` | Keep onboarding flow parity |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | `src/features/discovery/place-detail/components/place-detail-client.tsx` | Keep params mapping at route boundary |
| `src/app/(public)/places/[placeId]/courts/[courtId]/court-detail-client.tsx` | `src/features/discovery/place-detail/components/court-detail-client.tsx` | Keep params mapping at route boundary |
| `src/app/(public)/poc/google-loc/page-client.tsx` | `src/features/discovery/components/google-loc-page-client.tsx` | Preserve POC behavior |
| `src/app/(admin)/admin/tools/revalidate/actions.ts` | `src/lib/modules/admin/server/revalidate-actions.ts` | Server-only action module |

### Files to Keep in `src/app`

| Path | Reason |
| --- | --- |
| `src/app/(public)/privacy/page.mdx` | Route file (`page.mdx`) |
| `src/app/(public)/terms/page.mdx` | Route file (`page.mdx`) |

### Files to Delete

- `src/app/.DS_Store`

## Route Composition Pattern (After Extraction)

Every route file should follow this structure:

1. Parse params/searchParams.
2. Validate/normalize params.
3. Render feature component with typed props.
4. Do not define transport calls or heavy UI modules inline.

## Step-by-Step Execution

1. Move one file at a time from table above.
2. Update all imports in route files.
3. Keep route file names and URLs unchanged.
4. Run lint and route smoke for touched routes.
5. Commit extraction wave before hook/API refactors in same area.

## Checklist by Route Group

Status snapshot: `2026-02-18` (validated in `parity-evidence-2026-02-18.md`).

### Public Group (`src/app/(public)`)

- [x] Move courts page client module to discovery feature.
- [x] Move place detail and court detail client modules to discovery feature.
- [x] Move owner get-started client module to owner feature.
- [x] Move POC page client module to discovery feature.
- [x] Verify SEO metadata routes still render expected output.

### Auth Group (`src/app/(auth)`)

- [x] Keep auth pages route-composition-only.
- [x] Move any inline transport or business logic into feature hooks/components.
- [x] Verify login/register/magic-link/otp parity.

### Protected Group (`src/app/(protected)`)

- [x] Ensure pages only compose feature modules.
- [x] Verify no direct transport hooks remain.

### Owner Group (`src/app/(owner)` and `(owner-onboarding)`)

- [x] Ensure owner pages parse params and delegate to feature modules.
- [x] Remove any route-local helper components and inline transport logic.
- [x] Verify bookings, availability, import, setup flows.

### Admin Group (`src/app/(admin)`)

- [x] Move server actions out of route folders into `src/lib/modules/**/server` paths.
- [x] Keep admin pages as composition boundaries.
- [x] Verify claims/verification/courts/tools parity.

## Acceptance Criteria

1. No non-route component modules remain in `src/app` (except route-convention files). (`DONE`)
2. All moved modules compile and preserve behavior.
3. Route files are shorter and limited to boundary responsibilities.
