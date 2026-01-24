# Developer 1 Checklist

**Focus Area:** Remove `time_slot` materialization and owner slots UI

---

## Phase 1: Schema

**Reference:** `agent-plans/65-rules-exceptions-cutover/65-01-schema-cutover.md`

- [ ] Remove `time_slot` + `reservation_time_slot` schema files and exports
- [ ] Update `reservation` to be range-based
- [ ] Add block + price override tables

---

## Phase 2: Backend

**Reference:** `agent-plans/65-rules-exceptions-cutover/65-02-backend-cutover.md`

- [ ] Rewrite availability service to generate from schedule
- [ ] Rewrite reservation create/owner services without time slots
- [ ] Remove timeSlot router/module and all client references

---

## Phase 3: Owner UI

**Reference:** `agent-plans/65-rules-exceptions-cutover/65-03-owner-ui-cleanup.md`

- [ ] Remove/redirect owner slots pages
- [ ] Remove slot UI components/hooks
- [ ] Update navigation links to schedule/bookings

---

## Phase 4: QA

**Reference:** `agent-plans/65-rules-exceptions-cutover/65-04-qa.md`

- [ ] Manual smoke
- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
