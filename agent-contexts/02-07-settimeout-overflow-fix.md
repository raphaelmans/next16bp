---
tags:
  - agent-context
  - frontend/discovery
date: 2026-03-05
previous: 02-06-crossweek-visual-overlap.md
related_contexts:
  - "[[02-06-crossweek-visual-overlap]]"
  - "[[02-04-mobile-crossday-selection]]"
---

# Fix: Selection Flashes Then Disappears on 4+ Week Forward Navigation

## Summary

Selecting a time slot 25+ days in the future caused the selection to flash and immediately disappear. Root cause: browser `setTimeout` 32-bit signed integer overflow.

## Root Cause

In `place-detail-booking-section.tsx`, the slot-expiry effect computes a delay:

```
delayMs = selectedStartMs - Date.now() + 250
```

Browsers store `setTimeout` delays as a **32-bit signed integer** (max `2^31 - 1 = 2,147,483,647 ms`, ~24.8 days). When a slot is 25+ days in the future, the delay exceeds this limit, overflows to ~0, and the timeout fires immediately -- sending `SLOT_EXPIRED` and clearing the selection within milliseconds.

## Fix

One-line fix: cap the delay at the browser's max safe timeout value.

```typescript
const MAX_TIMEOUT_MS = 0x7fffffff;
const delayMs = Math.min(selectedStartMs - nowMs + 250, MAX_TIMEOUT_MS);
```

## Changes Made

| File | Change |
|------|--------|
| `src/features/discovery/place-detail/components/sections/place-detail-booking-section.tsx` | Cap `setTimeout` delay at `0x7fffffff` to prevent 32-bit integer overflow |

## Diagnostic Process

Added structured `console.warn("[DEBUG:*]")` logs across 8 files in the selection lifecycle to trace the bug:

1. First pass: identified `SLOT_EXPIRED` as the clearing event
2. Second pass: added machine event subscriber to confirm source
3. Third pass: instrumented setTimeout creation, firing, and cleanup -- revealed the timeout fired 23ms after being scheduled with a 25-day delay, confirming the overflow

## Decisions

- Used `0x7fffffff` (hex literal) for clarity that this is a browser platform limit, not a business constant
- Kept the comment explaining why the cap exists since the overflow behavior is non-obvious

## Next Steps

- None required; fix is complete and self-contained
