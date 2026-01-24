# Developer 1 Checklist

**Focus Area:** Enforce 60-day booking window (server + client)

---

## Phase 1: Server Enforcement

**Reference:** `agent-plans/63-booking-window-60-days/63-01-server-enforcement.md`

- [ ] Add `MAX_BOOKING_WINDOW_DAYS = 60` constant
- [ ] Update availability DTOs (range length + lead-time cap)
- [ ] Update time slot DTOs (`getAvailable`, `getForCourt`) with range caps
- [ ] Add `BookingWindowExceededError` and enforce in reservation creation
- [ ] Cap owner slot creation DTOs (`create`, `createBulk`) to <= 60 days

---

## Phase 2: Client Enforcement

**Reference:** `agent-plans/63-booking-window-60-days/63-02-client-enforcement.md`

- [ ] Add `maxDate` to public `KudosDatePicker` usages
- [ ] Cap month view calendar navigation and date selection
- [ ] Cap owner bulk slot modal date selection

---

## Phase 3: QA

**Reference:** `agent-plans/63-booking-window-60-days/63-03-qa.md`

- [ ] Manual QA (public booking, schedule, owner bulk)
- [ ] Run `pnpm lint`
- [ ] Run `TZ=UTC pnpm build`
