# Phase 2: Public Schedule Month View

**Dependencies:** Phase 1 complete  
**Parallelizable:** Partial  
**User Stories:** US-06 (public reservation discovery)

---

## Objective

Render a month view on the public schedule page that lists available start times for every day in the month (from today onward), while preserving day view and booking flows.

---

## Module 2A: Month View UI + URL State

**User Story:** `US-06`  
**Reference:** `54-00-overview.md`

### Directory Structure

```
src/app/(public)/courts/[id]/schedule/page.tsx
src/app/(public)/places/[placeId]/schedule/page.tsx
```

### UI Layout

```
┌─────────────────────────────────────────────┐
│ Schedule (Month/Day toggle)                 │
│ ┌───────────────┐  ┌─────────────────────┐ │
│ │ Month Calendar│  │ Day: Thu, Jan 22    │ │
│ │ (current→)    │  │ [time slots grid]   │ │
│ └───────────────┘  └─────────────────────┘ │
│                 [Day: Fri, Jan 23 ...]     │
└─────────────────────────────────────────────┘
```

### URL State

| Param | Example | Purpose |
|-------|---------|---------|
| `view` | `month` | Controls month vs day view |
| `month` | `2026-01` | Shareable month context |
| `date` | `2026-01-22` | Selected day key |
| `startTime` | ISO string | Selected slot |

### Implementation Steps

1. Add `view` + `month` params via `nuqs` with default `view=month`.
2. Derive month range in place time zone; clamp to today onward.
3. Fetch month availability via new range endpoints.
4. Group availability by day and render day sections.
5. Keep day view logic intact; day picker only visible in day view.
6. Selecting a slot in month view updates `date` + `startTime`.

### Code Example

```tsx
{monthAvailabilityByDay.map((day) => (
  <TimeSlotPicker
    key={day.dayKey}
    slots={day.slots}
    selectedId={selectedOptionId}
    onSelect={(slot) => {
      setDayKeyParam(day.dayKey);
      setStartTimeParam(slot.startTime);
    }}
  />
))}
```

### QA + Validation

- [ ] Month view defaults on load, with current month onward only.
- [ ] Day view still works with `KudosDatePicker`.
- [ ] Booking flow uses selected slot and preserves URL params.
- [ ] Calendar month navigation updates `month` param.
- [ ] Empty months show "No available start times".

---

## Phase Completion Checklist

- [ ] All month-view UI changes complete.
- [ ] Endpoints wired to new queries.
- [ ] `pnpm lint` passes.
- [ ] `TZ=UTC pnpm build` passes.
