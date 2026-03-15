# Phase 1: Backend — Player Reservations With Slot Details

**Dependencies:** Existing reservation + slot schema  
**Parallelizable:** No  
**User Story:** `agent-plans/user-stories/06-court-reservation/06-04-player-views-my-reservations-tabs.md`

---

## Objective

Expose a player-facing query that returns reservations enriched with reserved slot start/end times (and minimal court display fields) so the client can filter Upcoming/Past correctly and render the reserved time.

---

## Proposed API

### New endpoint

- **tRPC:** `reservation.getMyWithDetails`
- **Input:** `{ status?: ReservationStatus; upcoming?: boolean; limit: number; offset: number }`
- **Output:** Array of reservation rows enriched with:
  - `slotStartTime`, `slotEndTime` (ISO strings)
  - `courtName` (e.g. `${place.name} - ${court.label}`)
  - `courtAddress` (place address)
  - `coverImageUrl?` (optional; may be omitted initially)

### Notes

- Keep existing `reservation.getMy` intact to avoid breaking other consumers.
- Prefer a single JOINed query (no N+1).
- When a reservation spans multiple linked slots (`reservation_time_slot`), compute:
  - `slotStartTime = min(time_slot.start_time)`
  - `slotEndTime = max(time_slot.end_time)`

---

## Repository Work

- Add a repository method (e.g. `findByPlayerIdWithDetails`) in `src/modules/reservation/repositories/reservation.repository.ts`.
- Join:
  - `reservation` (playerId/status)
  - `reservation_time_slot` (optional)
  - `time_slot` (coalesce linked vs fallback)
  - `court` + `place`
- Sort order:
  - Upcoming-first views should sort by `slotStartTime ASC`
  - Past views can sort by `slotStartTime DESC` (client may also sort)

---

## Router + Service Work

- Add `reservation.getMyWithDetails` to `src/modules/reservation/reservation.router.ts`.
- Add service method delegating to repository.

---

## Validation Checklist

- [ ] Returns `slotStartTime`/`slotEndTime` as ISO strings
- [ ] Works with `status` filter and `upcoming` flag
- [ ] No TypeScript regressions in tRPC types
