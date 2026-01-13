# [00-30] Time Slot UTC Normalization

> Date: 2026-01-13
> Previous: 00-29-bulk-slots-build-fix.md

## Summary

Normalized time slot payloads and availability queries to UTC `Z` timestamps while keeping place time zone for local-day calculations, and added the supporting agent plan artifacts.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/time-zone.ts` | Added `toUtcISOString` helper and routed start-of-day ISO output through it. |
| `src/features/owner/hooks/use-slots.ts` | Normalized slot range queries and bulk slot payload timestamps to UTC `Z` strings. |
| `src/features/discovery/hooks/use-court-detail.ts` | Normalized availability query range timestamps to UTC `Z` strings. |

### Planning

| File | Change |
|------|--------|
| `agent-plans/25-time-slot-datetime-validation/25-00-overview.md` | Added master plan for UTC normalization. |
| `agent-plans/25-time-slot-datetime-validation/25-01-utc-normalization.md` | Added phase details for UTC normalization. |
| `agent-plans/25-time-slot-datetime-validation/time-slot-datetime-validation-dev1-checklist.md` | Added dev checklist. |
| `agent-plans/25-time-slot-datetime-validation/25-02-deferred.md` | Documented deferred offset-normalization work. |

## Key Decisions

- Enforced UTC `Z` timestamps for API payloads to keep storage consistent.
- Continued using `place.timeZone` for local day boundaries and display.

## Next Steps

- [ ] Validate bulk slot creation with a non-UTC place.

## Commands to Continue

```bash
pnpm lint
```
