# [00-98] Venue Slug Required

> Date: 2026-01-22
> Previous: 00-97-owner-onboarding-loop-fix.md

## Summary

Made venue slugs required and auto-derived from venue names, removed slug input/submission from owner UI/DTOs, and added an agent plan set for the slug enforcement work.

## Changes Made

### Backend + Schema

| File | Change |
| --- | --- |
| `src/shared/infra/db/schema/place.ts` | Marked `slug` as not null and made the unique index unconditional. |
| `src/modules/place/dtos/place.dto.ts` | Removed `slug` from create/update schemas. |
| `src/modules/place/services/place-management.service.ts` | Always derive slug from name and regenerate on rename. |

### Owner UI

| File | Change |
| --- | --- |
| `src/features/owner/schemas/place-form.schema.ts` | Removed slug field from form schema. |
| `src/features/owner/components/place-form.tsx` | Removed slug input and related logic. |
| `src/features/owner/hooks/use-place-form.ts` | Stopped sending slug in create/update payloads. |
| `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` | Removed slug from edit defaults. |

### Planning

| File | Change |
| --- | --- |
| `agent-plans/60-venue-slug-required/60-00-overview.md` | Master plan for slug enforcement. |
| `agent-plans/60-venue-slug-required/60-01-slug-enforcement.md` | Phase breakdown and steps. |
| `agent-plans/60-venue-slug-required/venue-slug-dev1-checklist.md` | Developer checklist. |

### Formatting Cleanup

| File | Change |
| --- | --- |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Removed unused variable. |
| `src/app/(public)/courts/[id]/opengraph-image.tsx` | Removed unused variable. |
| `scripts/backfill-place-slugs.ts` | Biome formatting adjustments. |
| `src/app/(public)/courts/page.tsx` | Organized imports. |
| `src/features/discovery/hooks/use-discovery.ts` | Biome formatting adjustments. |
| `src/modules/place/helpers.ts` | Biome formatting adjustments. |
| `src/shared/components/kudos/place-card.tsx` | Biome formatting adjustments. |
| `src/modules/contact/dtos/submit-contact-message.dto.ts` | Biome formatting adjustments. |
| `src/modules/contact/factories/contact.factory.ts` | Organized imports. |
| `src/modules/contact/repositories/contact-message.repository.ts` | Organized imports. |
| `src/features/contact/components/contact-us-form.tsx` | Biome formatting adjustments. |
| `src/app/(public)/courts/[id]/schedule/page.tsx` | Biome formatting adjustments. |
| `src/app/(public)/places/[placeId]/page.tsx` | Biome formatting adjustments. |
| `src/app/(owner)/owner/places/page.tsx` | Biome formatting adjustments. |
| `src/app/(owner)/owner/verify/[placeId]/page.tsx` | Biome formatting adjustments. |

## Key Decisions

- Slugs are derived from venue names only and update automatically on rename.
- Owner UI no longer exposes slug fields to avoid manual edits.
- DB uniqueness uses a full unique index now that slugs are required.

## Next Steps (if applicable)

- [ ] Run `pnpm db:push` after ensuring no missing slugs (user already ran this).
- [ ] `pnpm lint` and `TZ=UTC pnpm build` before release.

## Commands to Continue

```bash
pnpm db:push
pnpm lint
TZ=UTC pnpm build
```
