# Phase 1: Public Duration Hours Input

**Dependencies:** None
**Parallelizable:** Yes
**User Stories:** US-06-01, US-06-02, US-06-03

---

## Objective

Expose a 1-24 hour duration stepper across public detail, schedule, and booking pages while keeping URL params in minutes and validating against whole-hour limits.

---

## Modules

### Module 1A: Shared Duration Normalizer

**User Story:** `US-06-03`
**Reference:** `53-01-public-duration-hours.md`

#### Directory Structure

```
src/shared/lib/
└── duration.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| - | - | - | - |

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Duration (minutes) | number | Yes | 60-1440, multiple of 60 |

#### Implementation Steps

1. Add `normalizeDurationMinutes` helper that clamps and validates minutes.
2. Export a small helper to reuse in schedule + booking parsing.

---

### Module 1B: Public Duration Input UI

**User Story:** `US-06-01`, `US-06-02`, `US-06-03`
**Reference:** `53-01-public-duration-hours.md`

#### Directory Structure

```
src/app/(public)/places/[placeId]/page.tsx
src/app/(public)/courts/[id]/schedule/page.tsx
src/app/(auth)/places/[placeId]/book/page.tsx
```

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Duration (hours) | number | Yes | 1-24 (whole number) |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Duration                                    │
│                                             │
│  [-]  [ 1 ]  hours  [+]                     │
│                                             │
│  1-24 hours                                 │
└─────────────────────────────────────────────┘
```

#### Flow Diagram

```
Hours input change
    │
    ▼
Validate 1-24
    │
    ▼
minutes = hours * 60
    │
    ▼
Update state + clear selected slot
```

#### Implementation Steps

1. Replace duration button group on place detail with hours stepper.
2. Add draft input state to allow empty typing and commit on blur.
3. Replace duration button group on schedule page with stepper tied to URL.
4. Update schedule + booking duration parsing to accept any whole-hour minutes.

#### Testing Checklist

- [ ] Change duration to 4h updates availability and summary.
- [ ] Deep link with `duration=240` preserves 4h on schedule + booking.
- [ ] Empty input snaps back to 1h on blur.

---

## Phase Completion Checklist

- [ ] Shared helper added and used.
- [ ] Place detail, schedule, and booking pages updated.
- [ ] Lint/build pass.
