# Court Selection Memory

Court memory lives inside the `timeSlotMachine` context as `courtMemory: Record<string, CourtMemoryValue>`. It remembers the last selected `{startTime, durationMinutes}` per court, so switching between courts during multi-court booking restores where the user left off.

Previously this was a separate Zustand store (`useCourtSelectionMemoryStore`). Now the machine owns it — all save/restore/clear logic is handled by machine actions, not component code.

## Memory Key

```
buildMemoryKey(placeId, sportId, dayKey, courtId)
  -> "${placeId}|${sportId}|${dayKey}|${courtId}"
```

Example: `"place-abc|sport-tennis|2026-02-24|court-1"`

Keys are scoped to a single venue + sport + day + court. Changing any of these dimensions produces a different key, so memories don't leak across contexts.

## Context Shape

```ts
// Inside TimeSlotContext
courtMemory: Record<string, {
  startTime: string;
  durationMinutes: number;
}>
```

In-memory only (not persisted to localStorage). Cleared when the machine is destroyed (page navigation / unmount).

## Write Triggers

### On COMMIT_RANGE (slot selected in court mode)

When the user picks a time in court mode, court memory is updated as part of the commit:

```
User picks 10:00 AM on Court A
  |
  v
sendTimeSlot({ type: "COMMIT_RANGE", startTime, durationMinutes, courtMemoryKey })
  |
  v
Machine action (computeCommitRange):
  +-- startTime = "...T10:00:00Z"
  +-- durationMinutes = 60
  +-- if courtMemoryKey:
        courtMemory[key] = { startTime, durationMinutes }
```

This means the memory is always fresh as the user interacts, not only on court switch.

### On SELECT_COURT (save before leaving)

```
User switches from Court A -> Court B
  |
  v
Machine action (computeCourtSwitch):
  [1] Build previousKey = buildMemoryKey(placeId, sportId, date, oldCourtId)
  |
  [2] Guard: previousKey valid? && startTime exists?
  |   no -> skip save
  |   yes -> continue
  |
  [3] courtMemory[previousKey] = { startTime, durationMinutes }
```

Note: unlike the old Zustand store approach, there is no separate guard for "is court already in cart". The machine's `CART_ITEM_ADDED` event already removes the court from memory when it's added to cart (see Clear Trigger below).

## Read Trigger (restore on court switch)

```
User switches from Court A -> Court B
  |
  v
Machine action (computeCourtSwitch):
  [after saving Court A's selection]
  |
  [1] Build nextKey = buildMemoryKey(placeId, sportId, date, newCourtId)
  |
  [2] remembered = courtMemory[nextKey]
  |
  +-- Found?
  |     yes -> startTime = remembered.startTime
  |            durationMinutes = remembered.durationMinutes
  |            Slot appears highlighted on Court B
  |
  +-- Not found?
        -> startTime = null
           durationMinutes = defaultDurationMinutes
           No slot highlighted, duration reset
```

The machine handles both cases in a single `computeCourtSwitch` action. The `hasCourtMemory` guard exists for potential future branching but currently both paths go through the same action.

## Clear Trigger

### On CART_ITEM_ADDED

```
User adds Court A, 10:00 AM to cart
  |
  v
sendTimeSlot({ type: "CART_ITEM_ADDED", courtMemoryKey })
  |
  v
Machine action (computeCartItemAdded):
  +-- startTime -> null                   (selection cleared)
  +-- courtMemory[courtMemoryKey] -> deleted

  Why: if user switches away and back to Court A,
       we should NOT restore the carted slot — it's already booked
```

## Full Court Switch Sequence

```
State: Court A selected, 10:00 AM, 60 min

User clicks Court B
  |
  Machine receives: SELECT_COURT { courtId: "court-b" }
  |
  [1] computeCourtSwitch runs:
      Save Court A's slot to memory
        key = "place|sport|day|court-a"
        value = { startTime: "10:00", durationMinutes: 60 }
  |
  [2] courtId = "court-b"
  |
  [3] Check memory for Court B
      key = "place|sport|day|court-b"
  |
  [4a] Memory found (e.g. user was here before)
       -> restore: startTime = "11:00", durationMinutes = 60
       -> Court B shows 11:00 highlighted
  |
  [4b] No memory
       -> startTime = null, durationMinutes = defaultDurationMinutes
       -> Court B shows no selection, duration reset to 60

User clicks Court A again
  |
  [5] Save Court B's current slot (if any)
  |
  [6] Check memory for Court A
      -> Found: { startTime: "10:00", durationMinutes: 60 }
      -> Restore: Court A shows 10:00 highlighted again
```

## Interaction with Cart

```
Court A: 10:00 (in memory)    Court B: 11:00 (in memory)
  |                              |
User adds Court A to cart
  |
  +-- CART_ITEM_ADDED { courtMemoryKey: "place|sport|day|court-a" }
  +-- Cart: [{ court-a, 10:00 }]
  +-- courtMemory["court-a"] DELETED
  +-- startTime -> null
  |
User switches to Court B
  +-- SELECT_COURT { courtId: "court-b" }
  +-- courtMemory["court-b"] found -> restore 11:00
  |
User switches back to Court A
  +-- SELECT_COURT { courtId: "court-a" }
  +-- courtMemory["court-a"] NOT found (was deleted on CART_ITEM_ADDED)
  +-- startTime = null, durationMinutes = default -> no slot highlighted
  |
  This is correct: Court A's 10:00 is already in the cart,
  user should pick a different slot or different court.
```
