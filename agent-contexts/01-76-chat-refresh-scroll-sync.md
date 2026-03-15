# [01-76] Chat Refresh + Scroll Sync

> Date: 2026-02-07
> Previous: 01-75-booking-flash-overflow-fix.md

## Summary

Improved reservation and chat state freshness by expanding targeted tRPC invalidation in owner flows and manual chat refresh. Also wired a route scroll manager provider and kept booking-page loading safeguards and booking ID overflow handling in the working set.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/(owner)/owner/reservations/active/page.tsx` | Expanded manual refresh invalidation to include pending count and reservation chat thread metadata, not just organization reservations. |
| `src/app/(owner)/owner/reservations/page.tsx` | Updated offline payment success and manual refresh handlers to invalidate reservation list/count plus chat thread metas, and invalidate chat session for the affected reservation. |
| `src/features/chat/components/chat-widget/reservation-inbox-widget.tsx` | Added targeted `getThreadMetas` invalidation before fetch in manual refresh path to guarantee status reconciliation within stale-time windows. |
| `src/lib/modules/chat/ops/post-owner-confirmed-message.ts` | Removed owner-facing reservations link from owner-confirmation auto-message to keep player-facing message focused. |
| `src/common/providers/index.tsx` | Registered `RouteScrollManager` in app providers so route transitions reset scroll position predictably. |
| `src/common/providers/route-scroll-manager.tsx` | Added a client route scroll manager that scrolls to top on route/query changes, while preserving back/forward navigation behavior and hash-anchor navigation. |
| `src/app/(auth)/places/[placeId]/book/page.tsx` | Added resolvable-input + availability-fetch guard to keep booking skeleton visible while slot resolution is still in progress. |
| `src/features/reservation/components/reservation-actions-card.tsx` | Added min-width/flex constraints so long booking IDs truncate safely on small screens without horizontal overflow. |
| `docs/polling-state-approach.md` | Documented manual chat refresh requirement to invalidate and refetch reservation metadata, not fetch from cache only. |

### Planning

| File | Change |
|------|--------|
| `.opencode/plans/1770398021138-glowing-circuit.md` | Existing local planning file in workspace. |
| `.opencode/plans/1770398124284-proud-garden.md` | Existing local planning file in workspace. |
| `.opencode/plans/1770398545874-swift-star.md` | Existing local planning file in workspace. |

## Key Decisions

- Used targeted query invalidation (`reservationOwner` + `reservationChat`) instead of broad cache reset to keep refresh reliable and efficient.
- Preserved browser-native behavior by skipping auto scroll reset for `popstate` and hash-link navigations.
- Kept booking and reservation card fixes localized to their feature surfaces to avoid unrelated global UI behavior changes.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` after in-progress workspace edits settle.
- [ ] Verify owner reservations refresh updates chat badges/thread metadata immediately after offline confirmation.
- [ ] Verify route scroll behavior across push navigation, browser back/forward, and hash-link navigation.

## Commands to Continue

```bash
git status --short
pnpm lint
pnpm dev
```
