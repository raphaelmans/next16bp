# Phase 4: Player UI Revamp (Discovery → Place → Booking)

**Dependencies:** Phase 2 APIs available  
**Parallelizable:** Yes (with Phase 3 partially)  
**User Stories:** US-14-01, US-14-02, US-14-03, US-14-04, US-14-05

---

## Objective

Deliver a cohesive player flow that stays consistent across sports and places:

**Discover places → Place detail → Choose court or “Any available” → Choose duration + start time → Request booking**

---

## IA / Routes

- Discovery: existing route (update) to support sport filter
- Place detail: `/places/[placeId]` (or keep `/courts/[id]` but treat as place; decision TBD in implementation)
- Booking confirm: `/places/[placeId]/book` (proposed)

---

## UI Layout (Place Detail)

Key interactions:
- Sport filter/tabs (based on courts available at the place)
- Court selector list
- “Any available court” option
- Duration selector (60/120/180…)
- Availability grid of valid start times

```
┌─────────────────────────────────────────────┐
│ Place Name                                   │
│ Address • City                               │
│ [Sport: Pickleball ▼]                        │
│                                             │
│ Choose court                                │
│ ( ) Any available (lowest price)            │
│ ( ) Court 1  [Pickleball] [Premium?]        │
│ ( ) Court 2  [Pickleball]                   │
│                                             │
│ Duration                                    │
│ [ 60 ] [ 120 ] [ 180 ]                      │
│                                             │
│ Available start times                        │
│ [6:00] [7:00] [8:00] ...                    │
│ (each shows price when selected/hover)      │
└─────────────────────────────────────────────┘
```

---

## Booking Confirmation Screen

Must clearly show:
- Place name
- Assigned court (explicit even for “Any available”)
- Duration
- Total price
- Reservation contract expectation (awaiting owner acceptance)

---

## UI/UX Requirements

- Use design system colors:
  - Orange for availability affordances
  - Teal for primary CTA
- Step/flow clarity:
  - progress indicator for multi-step booking (at least “Select → Review”)
- Feedback:
  - reserve action shows loading and success/error

---

## Testing Checklist

- [ ] Discovery sport filter works
- [ ] Place detail shows courts and any-available option
- [ ] Duration changes valid start times
- [ ] Booking request shows assigned court
- [ ] Booking creates reservation and holds all slots
