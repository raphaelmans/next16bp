# [00-28] Court Setup Nuqs

> Date: 2026-01-13
> Previous: 00-27-publish-review-layout.md

## Summary

Unified owner court setup into a single query-driven wizard and migrated owner filter query handling to nuqs to prevent URL stomping across owner routes.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx` | Unified create/edit setup wizard with `courtId`/`step` query state. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/setup/page.tsx` | Redirect legacy setup route to unified wizard. |
| `src/shared/lib/app-routes.ts` | Updated setup routes to query-based URL. |
| `src/features/owner/components/courts-table.tsx` | Updated Setup Wizard links to include `step=details`. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Redirect create flow to unified setup with hours step. |
| `src/features/owner/hooks/use-owner-place-filter.ts` | Swapped manual URL sync for nuqs query state. |
| `src/features/owner/hooks/use-owner-court-filter.ts` | Swapped manual URL sync for nuqs query state. |
| `src/features/owner/components/reservation-alerts-panel.tsx` | Defaulted filter sync off to avoid URL pollution. |
| `AGENTS.md` | Added nuqs requirement for query params. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/21-court-setup-unification/21-00-overview.md` | Added plan overview. |
| `agent-plans/21-court-setup-unification/21-01-unified-setup-route.md` | Documented unified setup phase. |
| `agent-plans/21-court-setup-unification/court-setup-unification-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/22-owner-filter-nuqs/22-00-overview.md` | Added nuqs migration overview. |
| `agent-plans/22-owner-filter-nuqs/22-01-owner-filter-nuqs.md` | Documented filter migration phase. |
| `agent-plans/22-owner-filter-nuqs/owner-filter-nuqs-dev1-checklist.md` | Added dev checklist. |

## Key Decisions

- Use a single setup route with query state to avoid duplicated create/update flows.
- Move owner filters to nuqs query state to preserve existing params and prevent URL stomping.
- Disable alerts panel URL sync by default to avoid unintentional query injection.

## Next Steps (if applicable)

- [ ] QA setup wizard navigation retains `courtId` and `step` across reloads.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
