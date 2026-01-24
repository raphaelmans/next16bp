# Developer 1 Checklist

**Focus Area:** Booking window UX polish

---

## Phase 1: Deep-Link Clamping

**Reference:** `agent-plans/64-booking-window-ux/64-01-schedule-deeplink-clamp.md`

- [ ] Clamp `dayKey` beyond max to `maxDayKey`
- [ ] Clamp `month` beyond max to `maxMonthKey`
- [ ] Clear `startTime` when clamping changes the selected day

---

## Phase 2: Error Messaging

**Reference:** `agent-plans/64-booking-window-ux/64-02-window-error-messaging.md`

- [ ] Add schedule inline callout for booking-window rejection
- [ ] Map `BOOKING_WINDOW_EXCEEDED` to friendly toast message

---

## Phase 3: QA

**Reference:** `agent-plans/64-booking-window-ux/64-03-qa.md`

- [ ] Manual QA for deep links
- [ ] Manual QA for error messaging
- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
