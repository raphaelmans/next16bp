## Reservation Cart — Cross-Midnight Delta Spec

### Changed Behavior

Cart validation now supports bookings that span midnight.

### New Type

`BookingCartRuleItem.durationMinutes: number` — required field for computing multi-day span.

### New Function

```
getBookingCartDayKeys(item, placeTimeZone) → Set<string>
```

Computes the set of dayKeys an item spans:
- Same-day booking → 1 dayKey
- Cross-midnight booking → 2 dayKeys (start day + end day)

### Updated Validation

`validateBookingCartAdd()`:
- Previously: `referenceDayKey !== candidateDayKey` → DIFFERENT_DAY
- Now: `!referenceDayKeys.has(candidateDayKey)` → DIFFERENT_DAY
- Where `referenceDayKeys = getBookingCartDayKeys(firstCartItem, timeZone)`

### Frontend

`sameDayAnchorDayKey` in booking section uses the first dayKey from the set for week grid highlighting. The full set is available as `sameDayAnchorDayKeys` for future multi-day highlighting.
