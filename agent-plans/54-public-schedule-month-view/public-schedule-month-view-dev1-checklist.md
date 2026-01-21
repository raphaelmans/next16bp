# Developer 1 Checklist

**Focus Area:** Backend availability range + public schedule month UI  
**Modules:** 1A, 2A, 3A

---

## Module 1A: Availability Range Endpoints

**Reference:** `54-01-backend-range-availability.md`  
**User Story:** `US-06`  
**Dependencies:** None

### Setup

- [ ] Add range DTOs and validation limits.
- [ ] Add router endpoints.

### Implementation

- [ ] Implement `getForCourtRange` and `getForPlaceSportRange`.
- [ ] Ensure output sorted by start time.

### Testing

- [ ] Validate range limit errors.
- [ ] Spot-check bookability gating.

---

## Module 2A: Public Schedule Month View

**Reference:** `54-02-frontend-month-view.md`  
**User Story:** `US-06`  
**Dependencies:** Module 1A

### Setup

- [ ] Add `view` + `month` URL state via `nuqs`.
- [ ] Add month-range query wiring.

### Implementation

- [ ] Render month calendar and day section list.
- [ ] Disable past months/dates in venue TZ.
- [ ] Maintain existing day view behavior.

### Testing

- [ ] Month view shows slots from today onward.
- [ ] Selecting slot updates `date` + `startTime`.
- [ ] Day view still uses `KudosDatePicker`.

---

## Final Checklist

- [ ] `pnpm lint` passes.
- [ ] `TZ=UTC pnpm build` passes.
- [ ] No TypeScript errors.
