# Mobile Flow Step Machine

The mobile bottom sheet has a two-step flow controlled by local React state.

## States

```
"select"   — Step 1: pick sport, court, date, time slot
"review"   — Step 2: see cart items, remove/continue
```

Derived: `isReviewStep = mobileFlowStep === "review" && hasCartItems`

## State Diagram

```
                         +----------+
                  +----->| "select" |<-----+
                  |      +----------+      |
                  |        |      |        |
                  |        |      |        |
     [sheet       |   [Add to    [Review   |
      collapses]  |   booking]   booking]  |
     (no restore) |        |      |        |
                  |        v      v        |
                  |      +----------+      |
                  +------| "review" |------+
                         +----------+
                          |        |
               [Back to   |        |  [Cart emptied]
                select]   |        |  (auto-restore)
               (restore)  |        |  (restore)
                          v        v
                       +"select"  "select"

                         +----------+
                         | checkout |  --> navigates away
                         +----------+
                              ^
                              |
                    [Continue to review page]
```

## Transitions

### "select" -> "review"

**Path 1: Add to booking** (user has a slot selected + court mode)

```
User clicks "Add to booking"
  |
  v
handleAddToBooking()
  |
  +-- onSaveSnapshot()                    sendTimeSlot({ type: "SAVE_SNAPSHOT" })
  +-- onAddToCartAction()
  |     +-- handleAddToCart()             validate + sendCart("ADD_ITEM") + sendTimeSlot("CART_ITEM_ADDED")
  |
  +-- setMobileFlowStep("review")
```

Guard: `canAddToCart` must be true:
- `selectionMode === "court"`
- `hasSelection` (startTime is set)
- `selectedCourtId` is set
- `selectedSportId` is set

**Path 2: Open review** (cart has items, no current selection to add)

```
User clicks "Review booking (N)"
  |
  v
handleOpenReview()
  |
  +-- Guard: hasCartItems must be true
  +-- setMobileFlowStep("review")
```

### "review" -> "select"

**Path 1: Back button** (user explicitly goes back)

```
User clicks "Back to slot selection"
  |
  v
onBackToSelect()
  |
  +-- onRestoreSnapshot()     sendTimeSlot({ type: "RESTORE_SNAPSHOT" })
  |                           guard: hasSnapshot — restores startTime + durationMinutes from lastAddedSnapshot
  |
  v
setMobileFlowStep("select")
  |
  v
Slot appears highlighted in TimeRangePicker
```

**Path 2: Cart emptied** (all items removed in review)

```
Cart becomes empty while mobileFlowStep === "review"
  |
  v
useEffect auto-fires:
  +-- onBackToSelect()      sendTimeSlot({ type: "RESTORE_SNAPSHOT" })
  +-- setMobileFlowStep("select")
```

**Path 3: Sheet collapsed** (user drags sheet down)

```
mobileSheetExpanded becomes false
  |
  v
useEffect:
  +-- setMobileFlowStep("select")    NO restore — snapshot stays stale
```

### "review" -> checkout

```
User clicks "Continue to review page"
  |
  v
onContinueFromCart()
  |
  +-- handleReserve({ preferCartCheckout: true })
  |
  v
Build URL: /places/{slug}/book?sportId={sportId}&items=courtId|startTime|duration,...
  |
  +-- isAuthenticated? -> router.push(destination)
  +-- Not authenticated? -> router.push(login?returnTo=destination)
```

## Save/Restore Cycle (lastAddedSnapshot in timeSlotMachine)

This mechanism fixes the mobile bug where "Back to slot selection" showed no highlighted slot.

### Data Shape (in timeSlotMachine context)

```ts
lastAddedSnapshot: {
  startTime: string;       // ISO timestamp of the slot
  durationMinutes: number; // e.g. 60
} | null
```

NOT persisted to localStorage (ephemeral, session-only). Lives in machine context.

### Timeline

```
[1] User selects Court A, 10:00 AM, 60 min
    context: { startTime: "...T10:00:00Z", durationMinutes: 60 }

[2] User clicks "Add to booking"
    SAVE_SNAPSHOT event:
      lastAddedSnapshot = { startTime: "...T10:00:00Z", durationMinutes: 60 }

[3] handleAddToCart() runs
    CART_ITEM_ADDED event:
      startTime -> null (selection cleared)
      courtMemory for this court -> removed

[4] mobileFlowStep -> "review"
    User sees cart review screen

[5] User clicks "Back to slot selection"
    RESTORE_SNAPSHOT event (guard: hasSnapshot):
      startTime -> "...T10:00:00Z"
      durationMinutes -> 60
    lastAddedSnapshot remains (not cleared)

[6] mobileFlowStep -> "select"
    TimeRangePicker shows slot highlighted at 10:00 AM
```

### Edge: Multiple add-to-cart cycles

Each `SAVE_SNAPSHOT` overwrites the previous snapshot. Only the *most recently added* slot is restorable. This is by design — the user's most relevant context is the last slot they added.

### Edge: Sheet collapse during review

Sheet collapse resets to "select" but does NOT send `RESTORE_SNAPSHOT`. The startTime remains null (was cleared on `CART_ITEM_ADDED`). This is acceptable — collapsing the sheet is an implicit "I'm done" gesture. If the user reopens, they can still see their cart items and re-open review.
