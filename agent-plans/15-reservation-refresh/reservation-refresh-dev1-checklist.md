# Developer 1 Checklist

**Focus Area:** Reservation refresh + activity timeline  
**Modules:** 1A, 1B

---

## Module 1A: Reservation events API

**Reference:** `15-01-refresh-activity.md`

### Setup

- [ ] Review `reservation_event` schema + repository.

### Implementation

- [ ] Add service method to fetch reservation + events.
- [ ] Update `reservation.getById` response shape.
- [ ] Update DTO/types on client side.

### Testing

- [ ] Verify event ordering in API response.

---

## Module 1B: Player/Owner UI refresh + timeline

**Reference:** `15-01-refresh-activity.md`

### Implementation

- [ ] Add refresh button on player reservation detail.
- [ ] Replace Activity card with event timeline.
- [ ] Add refresh button on owner reservations list.
- [ ] Add refresh button on owner active reservations page.

### Testing

- [ ] Click refresh to see updated status without reload.

---

## Final Checklist

- [ ] `pnpm lint`
- [ ] `pnpm build`
