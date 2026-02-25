# Player Booking Flow — State Architecture Overview

The place-detail booking UI is driven by **2 XState v5 machines + 1 Zustand store + 1 local React state**, each owning a distinct concern.

## State Map

```
+-------------------------------+-------------------------------------------+--------------+
| State                         | File                                      | Persistence  |
+-------------------------------+-------------------------------------------+--------------+
| timeSlotMachine               | machines/time-slot-machine.ts              | localStorage |
| bookingCartMachine            | machines/booking-cart-machine.ts           | in-memory    |
| usePlaceDetailUiStore         | stores/place-detail-ui-store.ts           | in-memory    |
| mobileFlowStep (useState)    | components/place-detail-mobile-sheet.tsx   | local state  |
+-------------------------------+-------------------------------------------+--------------+
```

The two XState machines replaced three Zustand stores:
- `useBookingSelectionStore` + `useCourtSelectionMemoryStore` → `timeSlotMachine`
- `useBookingCartStore` → `bookingCartMachine`

## Component Hierarchy

```
PlaceDetailBookingSection              (orchestrator — owns cart actions, checkout, analytics)
  |
  +-- useBookingMachines()             (hook — creates both actors, wires bridge events)
  |     |
  |     +-- useMachine(timeSlotMachine)        (XState — selection + court memory)
  |     +-- useMachine(bookingCartMachine)     (XState — cart items + validation)
  |     +-- useTimeSlotPersistence()           (localStorage sync, debounced)
  |
  +-- PlaceDetailBookingDesktopSection         (desktop picker + sidebar)
  |     +-- Desktop availability queries
  |     +-- Court switch (machine handles memory internally)
  |
  +-- PlaceDetailBookingMobileSection          (mobile picker + queries)
  |     +-- Mobile availability queries
  |     +-- Court switch (machine handles memory internally)
  |     +-- Save/restore snapshot via bridge callbacks
  |
  +-- PlaceDetailMobileSheet                   (mobile bottom sheet UI)
        +-- mobileFlowStep state machine       ("select" | "review")
        +-- "Add to booking" / "Back to select" buttons
```

## Data Flow (happy path)

```
1. User opens place page
   -> timeSlotMachine created with persisted input from localStorage
   -> Cross-venue check: if persisted.placeId mismatch, machine starts fresh
   -> Auto-select first sport + first court (useEffect in hook)

2. User picks date + time slot
   -> sendTimeSlot({ type: "COMMIT_RANGE", startTime, durationMinutes, courtMemoryKey })
   -> Court memory updated in machine context (court mode)
   -> Analytics: funnel.schedule_slot_selected

3. User clicks "Add to booking" (mobile)
   -> sendTimeSlot({ type: "SAVE_SNAPSHOT" })       snapshots {startTime, durationMinutes}
   -> sendCart({ type: "ADD_ITEM", item })           validated + appended
   -> sendTimeSlot({ type: "CART_ITEM_ADDED", courtMemoryKey })
                                                     clears selection + removes court from memory
   -> mobileFlowStep -> "review"

4. User clicks "Back to slot selection"
   -> sendTimeSlot({ type: "RESTORE_SNAPSHOT" })     re-sets startTime + durationMinutes
   -> mobileFlowStep -> "select"
   -> Slot appears highlighted again

5. User clicks "Continue to review page"
   -> handleReserve() builds checkout URL from cart items
   -> Navigate to /places/{slug}/book?items=...
```

## Machine Communication (sibling bridge)

Both machines are independent — no parent-child spawning. The `useBookingMachines` hook creates both actors and bridges events between them:

```
useBookingMachines hook
  ├── [timeSlotActor]    ← useMachine(timeSlotMachine)
  ├── [cartActor]        ← useMachine(bookingCartMachine)
  └── Bridge (orchestrator callbacks):
        • sport change → sendCart({ type: "SPORT_CHANGED" })
        • add to cart  → sendTimeSlot("SAVE_SNAPSHOT") + sendCart("ADD_ITEM") + sendTimeSlot("CART_ITEM_ADDED")
        • slot expiry  → sendTimeSlot({ type: "SLOT_EXPIRED" })
```

Why sibling, not parent-child: each machine is independently importable and startable via `createActor()` for testing and the Stately visualizer.

## Documentation Index

| File | Contents |
|------|----------|
| [01-selection-state.md](./01-selection-state.md) | Time slot machine lifecycle, persistence, cross-venue handling |
| [02-mobile-flow.md](./02-mobile-flow.md) | Mobile flow step machine (select/review), save/restore cycle |
| [03-cart-state.md](./03-cart-state.md) | Booking cart machine, validation rules, CTA decision table |
| [04-court-memory.md](./04-court-memory.md) | Court switch memory: save, restore, and clear (in machine context) |
| [05-edge-cases.md](./05-edge-cases.md) | Date expiry, sport change, cross-venue, slot timeout |

## Source Files

All paths relative to `src/features/discovery/place-detail/`:

| File | Role |
|------|------|
| `machines/time-slot-machine.ts` | Time slot machine definition |
| `machines/time-slot-machine.types.ts` | Context, event, input types |
| `machines/time-slot-machine.guards.ts` | Pure guard functions |
| `machines/time-slot-machine.actions.ts` | Pure transformation functions |
| `machines/booking-cart-machine.ts` | Booking cart machine definition |
| `machines/booking-cart-machine.types.ts` | Context, event, types |
| `machines/booking-cart-machine.guards.ts` | Cart guard functions |
| `machines/booking-cart-machine.actions.ts` | Cart action transforms |
| `machines/index.ts` | Barrel exports for both machines |
| `hooks/use-booking-machines.ts` | React hook: creates both actors, wires bridges |
| `hooks/use-time-slot-persistence.ts` | localStorage read/write adapter |
| `helpers/build-cart-item.ts` | Cart item key + factory |
| `helpers/build-checkout-url.ts` | Checkout URL builders (single + cart) |
| `helpers/booking-cart-rules.ts` | Cart validation (same-day, dedup) — used by machine guards |
| `helpers/court-selection-memory.ts` | Memory key builder (legacy, replicated in machine actions) |
| `stores/place-detail-ui-store.ts` | Sheet/calendar/prefetch UI state (Zustand, unchanged) |
| `stores/booking-cart-store.ts` | BookingCartItem type definition (store deprecated) |
| `components/sections/place-detail-booking-section.tsx` | Orchestrator |
| `components/sections/place-detail-booking-mobile-section.tsx` | Mobile handlers |
| `components/sections/place-detail-booking-desktop-section.tsx` | Desktop handlers |
| `components/place-detail-mobile-sheet.tsx` | Mobile bottom sheet + flow step |
| `helpers/booking-cart-cta.ts` | CTA label/variant logic |
