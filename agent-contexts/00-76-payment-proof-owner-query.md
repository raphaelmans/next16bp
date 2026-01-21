# [00-76] Payment Proof Owner Query

> Date: 2026-01-20
> Previous: 00-75-verification-filter-fix.md

## Summary

Fixed owner reservations returning null payment proofs by reshaping the reservation query to avoid nested object select issues and ensure proof fields map back into the API response.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/modules/reservation/repositories/reservation.repository.ts` | Selected payment proof fields as top-level columns and rebuilt `paymentProof` in the mapper for consistent payloads. |
| `src/features/owner/hooks/use-owner-reservations.ts` | Added a normalizer to handle snake_case/camelCase proof fields defensively. |

## Key Decisions

- Flattened proof columns in the SQL select to avoid Drizzle nested-object serialization gaps.
- Added a client-side normalizer for resiliency against mixed casing across environments.

## Next Steps (if applicable)

- [ ] Re-fetch `reservationOwner.getForOrganization` to confirm `paymentProof.fileUrl` is present.

## Commands to Continue

```bash
pnpm dev
```
