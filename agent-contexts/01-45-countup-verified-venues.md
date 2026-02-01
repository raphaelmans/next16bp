# [01-45] Count-Up Animation Fix + Verified Venues Stat

> Date: 2026-02-02
> Previous: 01-44-landing-page-revamp-b.md

## Summary

Fixed the count-up animation bug on the landing page proof bar, replaced the custom `useCountUp` hook with the battle-tested `react-countup` package, and added a "Verified Venues" stat to the proof bar (conditionally shown when >= 10).

## Changes Made

### Bug Fix & Package Migration

| File | Change |
|------|--------|
| `src/app/home-count-up.tsx` | Deleted — replaced by `react-countup` package |
| `src/app/home-page-client.tsx` | Replaced `useCountUp` hook import with `CountUp` component from `react-countup`; updated `ProofBar` and `StatsCountBadge` to use `<CountUp>` with `duration={1.5}` and `separator=","` |
| `package.json` | Added `react-countup` (v6.5.3) dependency |

### Verified Venues Feature

| File | Change |
|------|--------|
| `src/lib/modules/place/repositories/place.repository.ts` | Added `totalVerifiedVenues` to `getPublicStats()` — joins `placeVerification` with `place` where `status = 'VERIFIED'` and `isActive = true` |
| `src/app/home-page-client.tsx` | Added "Verified Venues" count-up stat in `ProofBar`, conditionally rendered only when `totalVerifiedVenues >= 10` |

### Cleanup

| File | Change |
|------|--------|
| `public/drafts/` | Removed directory (HTML design drafts no longer needed) |

## Key Decisions

- **Replaced custom hook with `react-countup`**: The custom `useCountUp` had a bug where `startTime.current` wasn't reset between effect runs, causing animations to complete in a single frame (especially in React Strict Mode). Rather than continuing to patch, switched to the well-maintained `react-countup` library.
- **Conditional rendering for verified venues**: Only show the stat when count >= 10 to avoid displaying a low number that could undermine social proof.
- **Repository query uses inner join**: Verified count only includes active places with a `VERIFIED` status in the `placeVerification` table, ensuring accuracy.

## Next Steps

- [ ] Monitor verified venue count growth; threshold of 10 can be adjusted
- [ ] Consider adding scroll-spy to count-up animations (supported by `react-countup` via `enableScrollSpy` prop)
