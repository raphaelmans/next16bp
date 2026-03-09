---
tags:
  - agent-context
  - frontend/discovery
  - frontend/owner
date: 2026-03-09
previous: 03-11-availability-realtime-grants.md
related_contexts:
  - "[[03-11-availability-realtime-grants]]"
  - "[[03-00-availability-perf-optimization]]"
---

# [03-12] Availability Rate Limit Hardening

> Date: 2026-03-09
> Previous: 03-11-availability-realtime-grants.md

## Summary

Hardened the public reservation and owner availability flows against rate-limit churn and false empty states. The main changes were a shared live-query policy for expensive availability reads, explicit `429` handling in reservation UI, preservation of prior data during fetches, and correcting owner availability studio to use the place timezone from place detail data.

## Related Contexts

- [[03-11-availability-realtime-grants]] - Related availability freshness work and cache/realtime behavior in the same surface area.
- [[03-00-availability-perf-optimization]] - Earlier performance-focused availability work that overlaps with query warmness and transition behavior.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/common/live-query-options.ts` | Added shared live-query defaults and retry policy that disables retries for `rate_limited` errors and limits network retries. |
| `src/features/discovery/hooks/search.ts` | Applied shared live-query policy to discovery availability day/range hooks and kept prior data warm during transitions. |
| `src/features/discovery/hooks/place-detail.ts` | Applied the same live-query policy to legacy place-detail availability helpers and day-level court availability. |
| `src/features/discovery/helpers.ts` | Extended `getAvailabilityErrorInfo` with explicit `isRateLimited` classification. |
| `src/features/discovery/place-detail/components/place-detail-availability-desktop.tsx` | Prevented false empty-grid rendering on fetch error and added a rate-limit-specific retry message. |
| `src/features/discovery/place-detail/components/place-detail-mobile-sheet.tsx` | Added mobile availability error UI and blocked the grid from rendering a false empty state when queries fail. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-desktop-section.tsx` | Threaded availability-slot presence into desktop error rendering decisions. |
| `src/features/discovery/place-detail/components/sections/place-detail-booking-mobile-section.tsx` | Added mobile availability error derivation, jump-to-max-date handling, and slot-presence gating. |
| `src/features/discovery/place-detail/components/court-detail-client.tsx` | Updated day/week reservation error copy for rate-limited failures. |
| `src/features/discovery/place-detail/helpers/week-grid-query-window.ts` | Fixed adjacent-week anchor logic so far-away weeks no longer inherit stale anchor windows. |
| `src/features/owner/hooks/places.ts` | Preserved real place timezone when reading owner place detail, and exposed it through owner place mapping. |
| `src/features/owner/components/availability-studio/availability-studio-coordinator.tsx` | Switched blocks/reservations range queries to the shared live-query policy and sourced timezone from place detail. |
| `src/features/owner/components/place-court-availability/place-court-availability-coordinator.tsx` | Switched blocks/reservations range queries to the shared live-query policy. |
| `src/__tests__/common/live-query-options.test.ts` | Added retry-policy coverage for rate-limited and network failures. |
| `src/__tests__/features/discovery/hooks/availability-query-hooks.test.ts` | Updated hook expectations to assert the shared live-query policy and warm placeholder behavior. |
| `src/__tests__/features/discovery/helpers.test.ts` | Added coverage for rate-limited availability error classification. |
| `src/__tests__/features/discovery/place-detail/helpers/week-grid-query-window.test.ts` | Added coverage for non-adjacent week windows not expanding to stale anchors. |
| `src/__tests__/features/discovery/place-detail/components/place-detail-mobile-sheet.test.tsx` | Updated mobile sheet props for new availability error inputs. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-12-availability-rate-limit-hardening.md` | Logged the session context, decisions, and follow-up work. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/discovery` from changed files under `src/features/discovery/...`
- `frontend/owner` from changed files under `src/features/owner/...`

## Key Decisions

- Centralized availability query behavior in a shared live-query policy instead of duplicating per-hook retry and refetch rules.
- Treated `429` as a first-class UI failure mode so reservation views no longer fall through to the misleading `No availability this week` empty state.
- Disabled focus refetch for expensive live availability reads to reduce request bursts against the `publicAvailability` rate limit.
- Corrected owner availability studio timezone sourcing in the same pass because week/day boundary logic depends on it and was already implicated by the audit.

## Next Steps (if applicable)

- [ ] Revisit summary pricing requests and reduce or defer them when picker slot data already provides a usable local estimate.
- [ ] Audit next-week prefetch and realtime invalidation to avoid duplicate visibility fetches under heavy week navigation.
- [ ] Add Playwright coverage for the prod-style multi-week mobile reservation flow that previously triggered `429` and false empty-state behavior.

## Commands to Continue

```bash
pnpm exec vitest run src/__tests__/common/live-query-options.test.ts src/__tests__/features/discovery/hooks/availability-query-hooks.test.ts src/__tests__/features/discovery/helpers.test.ts src/__tests__/features/discovery/place-detail/helpers/week-grid-query-window.test.ts src/__tests__/features/discovery/place-detail/components/place-detail-mobile-sheet.test.tsx
pnpm exec tsc --noEmit
pnpm lint
```
