# Phase 5: Alerts Panel

**Dependencies:** Phase 4 complete  
**Parallelizable:** Yes  
**User Stories:** US-07-05

---

## Objective

Provide a floating, draggable alerts panel that surfaces active reservations, highlights new items since the last poll, and offers quick actions without leaving the current page.

---

## Modules

### Module 5A: Alerts Panel UI

**User Story:** `US-07-05`  
**Reference:** `07-00-overview.md`

#### Directory Structure

```
src/features/owner/components/reservation-alerts-panel.tsx
src/features/owner/hooks/use-reservation-alerts.ts
src/shared/components/ui/draggable-panel.tsx
```

#### UI Layout

```
┌──────────────────────────────────────┐
│ Active Reservations   [● 3]          │
│ Last updated: 2s ago                 │
│ ──────────────────────────────────── │
│ Raphael • Court A • 6:00 AM          │
│ [Awaiting payment] 09:45 left        │
│ [View] [Cancel]                      │
│ ──────────────────────────────────── │
│ Raphael • Court A • 7:00 AM          │
│ [Payment marked]                     │
│ [Confirm] [Reject]                   │
└──────────────────────────────────────┘
```

#### Component Notes

- Base structure: `Card` + `ScrollArea` + `Separator` + `Badge` + `Button`.
- Use design system tokens for status badges:
  - Warning for awaiting payment (`warning-light`)
  - Primary/teal for payment marked actions
  - Destructive for reject/cancel
- Draggable header bar with `cursor-grab`, neutral background, and `font-heading`.

#### Implementation Steps

1. Build `draggable-panel` wrapper using pointer events (or lightweight drag helper).
2. Create `ReservationAlertsPanel` with stacked reservation rows.
3. Add quick actions per status (confirm/reject/cancel/view).
4. Store last position in local storage for session persistence.

#### Testing Checklist

- [ ] Dragging stays within viewport bounds
- [ ] Panel collapse/expand works on owner pages
- [ ] Status badges use design system colors

---

### Module 5B: Polling + New Highlights

**User Story:** `US-07-05`  
**Reference:** `07-00-overview.md`

#### Implementation Steps

1. Implement polling hook (15s interval) for active reservations.
2. Track `lastUpdatedAt` timestamp and compare with reservation `createdAt`.
3. Add "New" badge for items created since last poll.
4. Display "Last updated" timestamp in panel header.

#### Testing Checklist

- [ ] Polling refreshes every 15s
- [ ] New badge appears only for items since last poll
- [ ] Error state shows retry action

---

## Phase Completion Checklist

- [ ] Alerts panel visible and draggable
- [ ] Polling and highlight logic works
- [ ] Quick actions linked to reservation endpoints
- [ ] No TypeScript errors
