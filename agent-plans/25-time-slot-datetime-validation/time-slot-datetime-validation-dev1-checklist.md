# Developer 1 Checklist

**Focus Area:** UTC normalization for time slot payloads  
**Modules:** 1A

---

## Module 1A: Shared UTC ISO helper + hook updates

**Reference:** `25-01-utc-normalization.md`  
**User Story:** `US-05-01`  
**Dependencies:** None

### Setup

- [ ] Review `agent-plans/context.md` for timezone guidance
- [ ] Scan existing TZDate usage in slot hooks

### Implementation

- [ ] Add `toUtcISOString` helper in `src/shared/lib/time-zone.ts`
- [ ] Update `getZonedStartOfDayIso` to use UTC helper
- [ ] Update `use-slots` range and bulk payload ISO generation
- [ ] Update `use-court-detail` start/end ISO generation

### Testing

- [ ] Create bulk slots in a non-UTC place
- [ ] Verify `timeSlot.getForCourt` works without validation errors

### Handoff

- [ ] Update overview if scope changes

---

## Final Checklist

- [ ] No TypeScript errors
- [ ] Slot creation uses UTC `Z` timestamps
- [ ] Availability queries use UTC `Z` timestamps
