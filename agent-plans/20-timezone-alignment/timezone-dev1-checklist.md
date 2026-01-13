# Developer Checklist

**Focus Area:** Place timezone alignment  
**Modules:** 1A, 1B

---

## Module 1A: Server Timezone Rules

**Reference:** `20-01-place-timezone.md`  
**User Story:** `US-06-*`

### Implementation

- [ ] Add timezone helper utilities
- [ ] Normalize availability day ranges in place TZ
- [ ] Resolve pricing rules in place TZ
- [ ] Align reservation slot-day queries

### Testing

- [ ] Run with `TZ=UTC`
- [ ] Verify pricing rule match by day/time

---

## Module 1B: Client Timezone Display

**Reference:** `20-01-place-timezone.md`  
**User Story:** `US-06-*`

### Implementation

- [ ] Pass place TZ to date picker + slot picker
- [ ] Format booking summary and order summary in place TZ
- [ ] Update owner calendars to use place TZ

### Testing

- [ ] Verify day labels in booking and owner flows

---

## Final Checklist

- [ ] No TypeScript errors
- [ ] Build passes
- [ ] Plan marked complete in overview
