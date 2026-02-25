# Edge Cases

## 1. Slot Expiry (time passes while user is on page)

Two guards run in `PlaceDetailBookingSection`:

### Past date auto-correction

```
useEffect:
  selectedDate exists?
    |
    +-- selectedDate < todayRangeStart?
          yes -> setSelectedDate(today)    jump to today
          no  -> keep current date
    |
    selectedDate is null?
          -> setSelectedDate(today)        default to today
```

### Slot start time expiry

```
useEffect (fires when selectedStartTime changes):
  |
  selectedStartMs <= now?
    yes -> sendTimeSlot({ type: "SLOT_EXPIRED" })     immediately clear
           Machine: startTime -> null, durationMinutes -> defaultDurationMinutes
    no  -> schedule timeout:
           setTimeout(() => sendTimeSlot({ type: "SLOT_EXPIRED" }), selectedStartMs - now + 250ms)
           |
           (250ms grace after slot starts — handles clock drift)
  |
  cleanup: clearTimeout on unmount or re-render
```

Result: stale selections never survive — the user always sees current availability.

## 2. Sport Change Clears Cart

```
Sport changes from Tennis -> Badminton
  |
  [1] Orchestrator detects sport change via prevSportIdRef
  |
  [2] sendCart({ type: "SPORT_CHANGED", sportId: "badminton" })
      Machine guard: willBeEmptyAfterSportChange?
        yes -> transition to "empty" state
        no  -> stay in "hasItems" with filtered items
      Action: filters out items where sportId !== "badminton"
  |
  [3] sendTimeSlot({ type: "SELECT_SPORT", sportId: "badminton" })
      Machine action (computeSportSelection):
        +-- courtId -> null
        +-- startTime -> null
        +-- mode -> "any"
        +-- durationMinutes -> defaultDurationMinutes
  |
  [4] Auto-select first court for new sport (useEffect in hook)
```

## 3. Cross-Venue Reset

When the user navigates from Venue A to Venue B, persisted state from Venue A is in localStorage.

```
Page mount for Venue B
  |
  [1] readPersistedSelection() reads Venue A's state from localStorage
  |
  [2] timeSlotMachine context factory checks:
      persisted.placeId === input.placeId (Venue B)?
        no -> all context fields start at defaults (ignores persisted state)
  |
  [3] useTimeSlotPersistence writes Venue B's clean state to localStorage
  |
  [4] Auto-select sport + court for Venue B (useEffect)
  |
  Result: clean slate for the new venue
```

In-memory state (cart machine context, court memory in time slot context) is naturally scoped — machines are destroyed on unmount when leaving Venue A.

## 4. "Any Court" Mode Switching

```
User is in court mode with Court A selected
  |
User clicks "Any court"
  |
  [1] sendTimeSlot({ type: "SET_MODE_ANY" })
      Machine action (computeModeAny):
        +-- mode -> "any"
        +-- courtId -> null
        +-- startTime -> null
        +-- durationMinutes -> defaultDurationMinutes
  |
  Result: mode switches, no court selected, slot cleared

User clicks a specific court (Court B)
  |
  [1] sendTimeSlot({ type: "SET_MODE_COURT" })
      Machine action (computeModeCourt):
        +-- mode -> "court"
        +-- startTime -> null
        +-- durationMinutes -> defaultDurationMinutes
  |
  [2] sendTimeSlot({ type: "SELECT_COURT", courtId: "court-b" })
      Machine action (computeCourtSwitch):
        +-- Check courtMemory for Court B
            -> found? restore startTime + durationMinutes
            -> not found? keep cleared
```

## 5. Duplicate Cart Item Attempt

```
Cart has: [Court A, 10:00, 60min]

User selects Court A, 10:00, 60min again
  |
  [1] sendCart({ type: "ADD_ITEM", item: { key: "court-a|...T10:00|60", ... } })
  [2] Machine guard (canAddItem):
      isBookingCartKeyDuplicate -> true
      guard returns false
  [3] Machine action (rejectItem):
      lastValidationError = "DUPLICATE_KEY"
  [4] Orchestrator reads lastValidationError -> shows toast
  [5] STOP — item not added, machine stays in current state
```

## 6. Different Day Cart Attempt

```
Cart has: [Court A, Feb 24, 10:00]

User changes date to Feb 25, selects Court B, 11:00
  |
  [1] sendCart({ type: "ADD_ITEM", item: { ... } })
  [2] Machine guard (canAddItem):
      validateBookingCartAdd checks:
        referenceDayKey = "2026-02-24"
        candidateDayKey = "2026-02-25"
        MISMATCH -> guard returns false
  [3] Machine action (rejectItem):
      lastValidationError = "DIFFERENT_DAY"
  [4] Orchestrator reads lastValidationError -> shows toast
  [5] STOP — item not added
```

## 7. Same Court, Different Time

```
Cart has: [Court A, 10:00, 60min]

User selects Court A, 14:00, 60min
  |
  [1] key = "court-a|...T14:00|60" (different key — not a duplicate)
  [2] Machine guard (canAddItem):
      isBookingCartKeyDuplicate -> false
      validateBookingCartAdd:
        same day? yes
        court-a already in cart? YES -> DUPLICATE_COURT
      guard returns false
  [3] lastValidationError = "DUPLICATE_COURT"
  [4] Toast: "You can only add one time span per court in this booking."
  [5] STOP — item not added
```

## 8. Cart Full (12 items)

```
Cart has 12 items

User tries to add item 13
  |
  [1] Machine guard (canAddItem):
      items.length >= maxItems (12) -> guard returns false
  [2] lastValidationError = "MAX_REACHED"
  [3] UI should prevent this case but guard is defense-in-depth
```

## 9. Back-to-Select After Multiple Adds

```
[1] Add Court A, 10:00  -> SAVE_SNAPSHOT: lastAddedSnapshot = {10:00, 60}
[2] Add Court B, 11:00  -> SAVE_SNAPSHOT: lastAddedSnapshot = {11:00, 60}  (overwrites)

User clicks "Back to slot selection"
  -> RESTORE_SNAPSHOT (guard: hasSnapshot)
  -> startTime = 11:00
  -> Only the LAST added slot is restored
  -> Court B's 11:00 is highlighted (correct — it's the most recent context)
```

## 10. Sheet Collapse During Review

```
User is in "review" step
User drags sheet down (collapse)
  |
  [1] mobileSheetExpanded -> false
  [2] setMobileFlowStep("select")    (NO RESTORE_SNAPSHOT sent)
  [3] startTime remains null (was cleared on CART_ITEM_ADDED)

User opens sheet again
  |
  [4] mobileFlowStep is "select"
  [5] No slot highlighted (startTime is null)
  [6] Cart items still exist — user can click "Review booking (N)"
```

This is intentional — collapsing is an "I'm done browsing" gesture.

## 11. Addon Sanitization

```
User has selectedAddons = [addonA, addonB]
Available addons change (e.g. court switch)
  |
  useEffect in booking-section:
  [1] sanitizeSelectedAddons(selected, available)
      -> removes addons not in available list
  [2] getAutoAddonIds(available)
      -> adds auto-required addons not yet selected
  [3] If result differs from current:
      sendTimeSlot({ type: "SET_ADDONS", addonIds: sanitized })
```

Addons live in `timeSlotMachine.context.addonIds` but are NOT persisted to localStorage. They reset on page refresh.

## 12. Race: Availability Query vs Selection

Mobile queries are gated by multiple conditions:

```
enabled = !isDesktop
       && mobileSheetExpanded
       && selectionMode === "any"|"court"  (matching)
       && selectedSportId|selectedCourtId  (set)
       && mobileDayDateIso                 (set)
```

If the user rapidly switches courts/sports, stale queries auto-disable and new ones fire. TanStack Query handles the race — only the latest enabled query's data is used.
