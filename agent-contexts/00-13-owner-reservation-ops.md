# [00-13] Owner Reservation Operations

> Date: 2026-01-11
> Previous: 00-12-court-management-wizard.md

## Summary

Implemented owner-facing reservation ops across slot list actions, active reservation monitoring with TTL, and a floating alerts panel. Added reservation detail view, polling hooks, and route support for active and detail pages aligned with the reservation state machine.

## Changes Made

### Backend & Data Contracts

| File | Change |
|------|--------|
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Joined reservation status, id, and TTL for owner slot list. |
| `src/modules/reservation/dtos/reservation-owner.dto.ts` | Added `reservationId` filter and `expiresAt` to DTOs. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Added reservation ID filtering and surfaced `expiresAt` in results. |
| `src/modules/reservation/services/reservation-owner.service.ts` | Passed reservationId filter to repository query. |

### Frontend Hooks

| File | Change |
|------|--------|
| `src/features/owner/hooks/use-slots.ts` | Mapped reservation status data and wired confirm/reject mutations. |
| `src/features/owner/hooks/use-owner-reservations.ts` | Added polling support, reservationId filtering, and TTL fields. |
| `src/features/owner/hooks/use-reservation-alerts.ts` | Added 15s polling helper hook. |

### UI & Pages

| File | Change |
|------|--------|
| `src/features/owner/components/slot-item.tsx` | Accurate pending labels + state-based quick actions. |
| `src/features/owner/components/slot-list.tsx` | Routed reservation actions with reservation IDs. |
| `src/features/owner/components/reject-modal.tsx` | Added configurable labels for cancel vs reject. |
| `src/shared/components/ui/draggable-panel.tsx` | New draggable panel base. |
| `src/features/owner/components/reservation-alerts-panel.tsx` | Floating alerts with polling and actions. |
| `src/shared/components/layout/app-shell.tsx` | Added `floatingPanel` slot for owner overlays. |
| `src/app/(owner)/owner/reservations/active/page.tsx` | New active reservations page with TTL countdowns. |
| `src/app/(owner)/owner/reservations/[id]/page.tsx` | New owner reservation detail page. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Wired slot actions + alerts panel. |
| `src/app/(owner)/owner/reservations/page.tsx` | Added alerts panel and shared components import. |
| `src/app/(owner)/owner/courts/page.tsx` | Added alerts panel integration. |
| `src/app/(owner)/owner/courts/new/page.tsx` | Added alerts panel integration. |
| `src/app/(owner)/owner/courts/[id]/edit/page.tsx` | Added alerts panel integration. |
| `src/app/(owner)/owner/settings/page.tsx` | Added alerts panel integration. |
| `src/app/(owner)/owner/page.tsx` | Added alerts panel integration. |
| `src/shared/lib/app-routes.ts` | Added owner reservation detail + active routes. |

## Key Decisions

- Drive slot list labels and actions from reservation status instead of slot status alone.
- Poll active reservations every 15s and highlight new items since last refresh.
- Provide a dedicated active reservation page plus a floating panel for rapid response.

## Next Steps (if applicable)

- [ ] Run `pnpm lint` and spot check owner reservation flows.
- [ ] Add migration/backfill for reservation TTL/indexing if needed.

## Commands to Continue

```bash
pnpm lint
```
