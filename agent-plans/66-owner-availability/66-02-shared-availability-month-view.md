# Phase 2: Shared Month Availability View

**Dependencies:** Phase 1 complete (to remove owner calendar that depends on `timeSlot`)
**Parallelizable:** Partial

## Objective

Extract the month-first availability calendar UI (left calendar + right per-day slot lists) into a reusable component that both owner and public schedule pages can use.

## Component

### Location

- `src/shared/components/kudos/availability-month-view.tsx`
- Export from `src/shared/components/kudos/index.ts`

### Props (proposed)

```ts
import type { TimeSlot } from "@/shared/components/kudos";

export type AvailabilityMonthDay = {
  dayKey: string;
  date: Date;
  slots: TimeSlot[];
};

export type AvailabilityMonthViewProps = {
  selectedDate?: Date;
  month: Date;
  fromMonth: Date;
  toMonth: Date;
  minDate: Date;
  maxDate: Date;
  availableDates: Date[];
  days: AvailabilityMonthDay[];
  selectedSlotId?: string;
  isLoading?: boolean;
  timeZone?: string;
  onSelectDate: (date?: Date) => void;
  onMonthChange: (date: Date) => void;
  onToday?: () => void;
  onSelectSlot?: (args: { dayKey: string; slot: TimeSlot }) => void;
  emptyState?: React.ReactNode;
};
```

### UI layout

```
┌──────────────────────────────────────────────────────────┐
│ [Browse month]                                [Today]    │
│ ┌────────────── Calendar ──────────────┐  ┌───────────┐  │
│ │                                      │  │ Day list   │  │
│ │ (available days highlighted)         │  │ + slots     │  │
│ └──────────────────────────────────────┘  └───────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Integration

- Replace the inline month-view markup in `src/app/(public)/courts/[id]/schedule/page.tsx` with the shared component.
- No changes to URL state management (nuqs) or query behavior.

## Testing Checklist

- [ ] Public schedule month view looks and behaves the same.
- [ ] Date selection still scrolls to the selected day section.
- [ ] Slot selection still sets `startTime` and enables "Continue".
