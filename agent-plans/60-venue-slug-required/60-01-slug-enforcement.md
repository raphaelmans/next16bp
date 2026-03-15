# Phase 1: Slug Enforcement + UI Removal

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** None (ad-hoc change)

---

## Objective

Ensure venue slugs are required, derived from the venue name, and hidden from owner UI/DTOs.

---

## Modules

### Module 1A: DB + Backend Enforcement

**Reference:** `60-00-overview.md`

#### API/Schema Changes

| Area | Change |
| --- | --- |
| DB schema | `place.slug` becomes NOT NULL and unique without partial index |
| Place DTOs | Remove `slug` from Create/Update schemas |
| Place service | Always derive slug from `name`, update on rename |

#### Implementation Steps

1. Update `src/shared/infra/db/schema/place.ts` to make `slug` not null.
2. Remove the partial unique index filter from `uq_place_slug`.
3. Remove `slug` from create/update DTOs in `src/modules/place/dtos/place.dto.ts`.
4. Update `src/modules/place/services/place-management.service.ts`:
   - Create: always `resolvePlaceSlug({ fallbackName: data.name })`.
   - Update: when `data.name` is present, regenerate slug; if missing and slug is null, backfill from existing name.

#### Testing Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

### Module 1B: Owner UI + DTO Cleanup

**Reference:** `60-00-overview.md`

#### UI/DTO Changes

| Area | Change |
| --- | --- |
| Owner form schema | Remove `slug` field |
| Owner form UI | Remove slug input and preview |
| Submission payload | Stop sending slug in create/update |

#### Implementation Steps

1. Remove `slug` from `src/features/owner/schemas/place-form.schema.ts`.
2. Remove slug field and related logic from `src/features/owner/components/place-form.tsx`.
3. Remove slug from create/update payloads in `src/features/owner/hooks/use-place-form.ts`.
4. Remove slug defaults in `src/app/(owner)/owner/places/[placeId]/edit/page.tsx`.

#### Testing Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

## Phase Completion Checklist

- [ ] Schema + DTO updates complete
- [ ] Owner UI cleaned up
- [ ] Slug regeneration on rename works
- [ ] Lint/build pass
