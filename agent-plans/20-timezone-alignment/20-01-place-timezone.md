# Phase 1: Place Timezone Normalization

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-06-* (booking), US-05-* (availability management)

---

## Objective

Ensure availability queries, pricing rules, booking flows, and owner slot tooling all interpret dates and times in the place’s IANA timezone.

---

## Modules

### Module 1A: Server Timezone Rules

**User Story:** `US-06-*`  
**Reference:** `20-01-place-timezone.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `availability.getForCourt` | Query | `{ courtId, date, durationMinutes }` | `AvailabilityOption[]` |
| `availability.getForPlaceSport` | Query | `{ placeId, sportId, date, durationMinutes }` | `AvailabilityOption[]` |
| `timeSlot.create` | Mutation | `{ courtId, startTime, endTime, ... }` | `TimeSlotRecord` |

#### Implementation Steps

1. Add shared timezone helpers (day range, weekday/minute-of-day).
2. Normalize availability day ranges using place timezone.
3. Resolve pricing rules using place-local weekday/minute-of-day.
4. Normalize reservation slot-day lookups with place timezone.

#### Testing Checklist

- [ ] Availability returns correct slots for place-local day under `TZ=UTC`
- [ ] Pricing rules match expected day/time when server is UTC
- [ ] Reservation creation handles DST transitions

---

### Module 1B: Client Timezone Display

**User Story:** `US-06-*`  
**Reference:** `20-01-place-timezone.md`

#### UI Layout

```
┌──────────────────────────────┐
│ Date Picker (place TZ)        │
│ Time Slots (place TZ)         │
│ Booking Summary (place TZ)    │
└──────────────────────────────┘
```

#### Implementation Steps

1. Add timeZone support to shared date picker.
2. Pass place timeZone to booking and availability hooks.
3. Format slot times in place timezone across booking views.
4. Align owner slot management calendar to place timezone.

#### Testing Checklist

- [ ] Date picker highlights correct place-local day
- [ ] Slot list times match place timezone
- [ ] Owner slot creation aligns with place local time

---

## Phase Completion Checklist

- [ ] Server timezone logic updated
- [ ] Client timezone formatting updated
- [ ] Lint/build passes
- [ ] Verified in UTC runtime
