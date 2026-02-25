# Selection State Lifecycle

The booking selection lives in the `timeSlotMachine` (XState v5), created via `useMachine()` in the `useBookingMachines` hook.

## Context Shape

```ts
type TimeSlotContext = {
  placeId: string;                  // anchored to current venue
  placeTimeZone: string;
  sportId: string | null;           // persisted
  date: string | null;              // day key YYYY-MM-DD in place tz, persisted
  durationMinutes: number;          // persisted
  defaultDurationMinutes: number;   // from input
  mode: "any" | "court";           // persisted
  courtId: string | null;           // persisted
  viewMode: "week" | "day";        // unified (was anyView + courtView)
  startTime: string | null;         // ISO timestamp, persisted
  addonIds: string[];               // not persisted
  courtMemory: Record<string, CourtMemoryValue>;  // not persisted (in-memory)
  lastAddedSnapshot: { startTime: string; durationMinutes: number } | null;  // not persisted
  availableSports: AvailableSport[];
  availableCourts: AvailableCourt[];
};
```

Persistence is handled by `useTimeSlotPersistence` — a React hook that debounces writes to localStorage (300ms). Only a subset of fields are persisted (see Persistence section below).

## Initialization Sequence

```
Mount
  |
  v
[1] useBookingMachines reads localStorage via readPersistedSelection()    (once, via useRef)
  |
  v
[2] Creates timeSlotMachine with persisted input:
    context factory checks: persisted.placeId === input.placeId?
      yes -> restore persisted fields (sportId, date, duration, mode, courtId, startTime)
      no  -> start fresh (all null/defaults)
  |
  v
[3] useEffect syncs availableCourts + availableSports from place data
    sendTimeSlot({ type: "SYNC_AVAILABLE_COURTS" })
    sendTimeSlot({ type: "SYNC_AVAILABLE_SPORTS" })
  |
  v
[4] Auto-select first sport?
    Guard: !selectedSportId && place && isBookable
    Action: sendTimeSlot({ type: "SELECT_SPORT", sportId: place.sports[0].id })
  |
  v
[5] Auto-select first court?
    Guard: selectionMode === "court" && !selectedCourtId && courtsForSport[0]
    Action: sendTimeSlot({ type: "SELECT_COURT", courtId: courtsForSport[0].id })
```

## Event-Driven State Transitions

The machine uses a flat root node with `on:` handlers (not parallel states). All transitions produce context mutations via `assign()`.

### `startTime` Lifecycle

```
                    +-----------+
                    |   null    |  <-- initial / after clear
                    +-----------+
                         |
        [COMMIT_RANGE: user picks slot in TimeRangePicker]
                         |
                         v
                    +-----------+
                    |    set    |  <-- ISO timestamp, e.g. "2026-02-24T10:00:00Z"
                    +-----------+
                    |    |    |
         +----------+   |    +------------------+
         |               |                       |
  [CLEAR_SELECTION]  [SLOT_EXPIRED]       [RESTORE_SNAPSHOT]
         |               |                (guard: hasSnapshot)
         v               v                       |
    +-----------+   +-----------+                 v
    |   null    |   |   null    |           +-----------+
    +-----------+   +-----------+           |    set    |
                                            +-----------+
```

### Events That Clear Selection

| Event | `resetDuration?` | Dispatched from |
|-------|------------------|-----------------|
| `CART_ITEM_ADDED` | no (preserves duration) | orchestrator after add-to-cart |
| `SELECT_DATE` | yes (resets to default) | date picker handlers |
| `SELECT_SPORT` | yes (clears all) | sport change handlers |
| `SET_MODE_ANY` / `SET_MODE_COURT` | yes | mode toggle |
| `SET_VIEW_WEEK` / `SET_VIEW_DAY` | yes | view mode switch |
| `SELECT_COURT` (no memory) | yes | court switch (machine internal) |
| `CLEAR_SELECTION` | configurable via `resetDuration` | explicit clear |
| `SLOT_EXPIRED` | yes (resets to default) | expiry timer in orchestrator |

### CLEAR_SELECTION Behavior

```
CLEAR_SELECTION { resetDuration? }
  |
  set startTime -> null
  |
  resetDuration?
    yes -> durationMinutes -> defaultDurationMinutes
    no  -> keep current durationMinutes
```

## `sportId` Transitions

```
    null  ---[auto-select useEffect]--->  place.sports[0].id
      |
  [SELECT_SPORT { sportId }]
      |
      v
    Machine action (computeSportSelection):
      +-- courtId -> null
      +-- startTime -> null
      +-- mode -> "any"
      +-- durationMinutes -> defaultDurationMinutes
    |
    Bridge in orchestrator:
      +-- clearCartForSportChange(sportId)   (wipes cart items from old sport)
```

## `courtId` Transitions

```
    null  ---[auto-select useEffect]--->  courtsForSport[0].id
      |        (only in "court" mode)
      |
  [SELECT_COURT { courtId }]
      |
      v
    Machine action (computeCourtSwitch):
      +-- Save previous court's slot to courtMemory (if startTime set)
      +-- Set courtId to new court
      +-- Check courtMemory for new court:
          |
          +-- Has memory? -> restore startTime + durationMinutes
          +-- No memory?  -> startTime = null, durationMinutes = default
      |
  [CLEAR_COURT]
      |
      v
    Machine action (assignClearCourt):
      +-- courtId -> null
      +-- startTime -> null
      +-- mode -> "any"
```

## Persistence

The `useTimeSlotPersistence` hook syncs a subset of context to localStorage:

```
localStorage["booking-selection"] = {
  state: {
    placeId, date, duration, sportId, mode, courtId, startTime
  },
  version: 0
}
```

Format is backward-compatible with the previous Zustand `persist` middleware format.

### On mount
`readPersistedSelection()` reads from localStorage and passes as `persisted` input to the machine's context factory.

### On context change
Debounced (300ms) write of `{ placeId, date, durationMinutes, sportId, mode, courtId, startTime }` back to localStorage.

### Cross-venue
If `persisted.placeId !== currentPlaceId`, the context factory ignores persisted state and starts fresh.

## Page Refresh Behavior

On refresh, persisted fields are restored via machine input:

- If `placeId` matches current page -> selection restored (slot highlighted)
- If `placeId` differs -> start fresh, all fields at defaults
- Past date -> corrected to today (see edge cases)
- Past startTime -> immediately cleared by expiry timer (see edge cases)
