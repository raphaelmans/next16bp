# Phase 3: Owner UI Revamp (Places, Courts, Hours, Pricing, Slots)

**Dependencies:** Phase 2 APIs available  
**Parallelizable:** Yes (with Phase 4 partially)  
**User Stories:** US-14-06, US-14-07, US-14-08, US-14-09, US-14-11

---

## Objective

Deliver a cohesive owner workflow:

**Places → Courts → (Hours + Pricing) → Slots**

All screens must follow `business-contexts/kudoscourts-design-system.md` and ui-ux-pro-max form guidance:
- progress indicator for multi-step flows
- submit feedback
- labeled inputs

---

## IA / Routes (proposed)

- `/owner/places`
- `/owner/places/new`
- `/owner/places/[placeId]/edit`

- `/owner/places/[placeId]/courts`
- `/owner/places/[placeId]/courts/new`
- `/owner/places/[placeId]/courts/[courtId]/edit`

- `/owner/places/[placeId]/courts/[courtId]/hours`
- `/owner/places/[placeId]/courts/[courtId]/pricing`
- `/owner/places/[placeId]/courts/[courtId]/slots`

---

## UX Patterns

### Place Creation (multi-step)

Step indicator required.

```
┌─────────────────────────────────────────────┐
│ Create Place                   Step 1 of 2  │
│                                             │
│ [Name] [City]                                │
│ [Address]                                   │
│ [Timezone] (default Asia/Manila)            │
│                                             │
│ [Cancel]                         [Next]     │
└─────────────────────────────────────────────┘
```

### Courts list under a place

- Bento cards listing courts.
- Each card shows: label, sport badge, tier label (if any), active.
- Primary CTA: “Add Court” (Teal).

### Court Hours Editor

- Weekly grid UI (Mon–Sun).
- Supports multiple windows/day.
- Supports “overnight” input by allowing end time earlier than start time in UI, then auto-splitting.

### Pricing Rules Editor

- Similar weekly grid UI.
- Each row: day, start time, end time, hourly rate, currency.
- Prevent overlaps with immediate feedback.

### Slots Calendar

- Court-scoped.
- Bulk create 60-min slots for a date range.
- Display slot status and price.

---

## Form Fields (high level)

### Place
- name (text)
- address (text)
- city (select)
- latitude (number, optional)
- longitude (number, optional)
- timeZone (select, default Asia/Manila)

### Court
- label (text)
- sport (select)
- tierLabel (select or text)

### Hours window
- dayOfWeek (select)
- startTime (time)
- endTime (time)

### Pricing rule
- dayOfWeek (select)
- startTime (time)
- endTime (time)
- currency (select)
- hourlyRate (number)

---

## Testing Checklist

- [ ] Owner can create/edit place
- [ ] Owner can add/edit courts
- [ ] Hours editor supports multiple windows and overnight
- [ ] Pricing editor prevents overlaps
- [ ] Slots page shows correct court context and status
- [ ] Filters by place/court work across owner ops
