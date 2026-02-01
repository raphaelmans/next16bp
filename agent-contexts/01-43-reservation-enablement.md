# [01-43] Reservation Enablement

> Date: 2026-02-01
> Previous: 01-42-feb01-bugfixes.md

## Summary

Added a shared reservation enablement utility and wired it into the public venue page and owner availability studio to consistently surface missing prerequisites (verification, reservations enabled, schedule, pricing). Also fixed public “any court” empty state to use real diagnostics.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/common/reservation-enablement.ts` | Added shared utility to compute booking eligibility and issue list. |
| `src/features/discovery/helpers.ts` | Reused shared util to drive `showBooking` logic. |
| `src/app/(public)/places/[placeId]/place-detail-client.tsx` | Passed diagnostics to “any court” day empty state. |
| `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/availability/page.tsx` | Added schedule/pricing warnings and unified banner checks using shared util. |
| `src/lib/modules/availability/dtos/availability.dto.ts` | Added optional `reservationsDisabled` to diagnostics schema. |
| `src/features/discovery/hooks.ts` | Updated diagnostics interface to include `reservationsDisabled`. |

## Key Decisions

- Centralized reservation enablement rules in `src/common` to keep public and owner UIs consistent.
- Owner studio surfaces schedule/pricing warnings (non-blocking) since missing setup explains public availability empty states.

## Next Steps

- [ ] Run `pnpm lint` and `TZ=UTC pnpm build`.
- [ ] Verify `/venues/kusos-courts-complex` and owner availability studio show the correct warnings.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
