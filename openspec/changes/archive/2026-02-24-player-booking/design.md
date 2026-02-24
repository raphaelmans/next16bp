## Context

Guest-to-booking conversion currently breaks in two places:

- Pre-auth: the booking CTA did not always preserve full slot context through login.
- Post-auth: profile completion pushed users to a separate page, interrupting booking.

The implemented scope in this change introduces a cart-safe booking redirect (`/courts/{courtId}/book/{slotId}`), a short-lived pending-booking backup in localStorage, and an inline profile setup modal on the booking page. This spans discovery/auth entry points plus reservation-page interaction and must preserve existing booking semantics without introducing new backend contracts.

## Goals / Non-Goals

**Goals:**

- Preserve court + slot context for guest users moving through auth into booking.
- Recover booking context when query params are absent using a constrained client-side fallback.
- Keep profile completion inside the booking surface so users do not abandon flow state.
- Ensure booking confirmation remains blocked until profile completeness requirements are met.

**Non-Goals:**

- No redesign of auth callback route handling or redirect safety policy.
- No server-side persistence for pending booking context.
- No changes to reservation pricing, availability computation, or payment behavior.
- No expansion of profile requirements beyond existing completeness rules.

## Decisions

### Decision 1: Use booking URL as canonical redirect payload

- Choice: pass `/courts/{courtId}/book/{slotId}` as the redirect target from discovery CTAs.
- Rationale: this is already a valid route type under existing safe-redirect checks and carries the minimum stable context needed to restore booking state.
- Alternative considered: keep redirecting to court detail page and reselect slot.
- Why rejected: higher friction and measurable conversion loss from repeated slot selection.

### Decision 2: Add client-only pending booking backup with TTL

- Choice: write `kudos:pending-booking` before auth redirect with `{ courtId, slotId, startTime, expires }` and 30-minute TTL.
- Rationale: covers redirect-param loss edge cases (provider/callback variability) while bounding stale-data risk and avoiding server-side complexity.
- Alternative considered: persist pending booking on the server keyed to session/device.
- Why rejected: requires new backend APIs, storage lifecycle, and privacy/cleanup handling for low-value transient state.

### Decision 3: Integrate recovery via a reservation hook (`usePendingBooking`)

- Choice: read/validate storage via a feature hook and seed booking params only when `startTime` is absent and court matches.
- Rationale: keeps storage parsing deterministic, testable, and isolated from page orchestration; aligns with client state-management guide boundaries.
- Alternative considered: inline localStorage reads directly in `PlaceBookingPage`.
- Why rejected: duplicates parsing logic and increases risk of inconsistent guard behavior.

### Decision 4: Gate confirmation in-place with banner + overlay + modal

- Choice: keep users on `PlaceBookingPage`, show non-blocking profile banner plus summary overlay CTA, and open `ProfileSetupModal` for completion.
- Rationale: preserves booking context while making incompleteness explicit and recoverable in one surface.
- Alternative considered: keep hard navigation to profile page.
- Why rejected: context abandonment and return-path fragility for time-sensitive slot booking.

## Risks / Trade-offs

- [Stale localStorage entry causes wrong seed] -> Enforce TTL and strict `courtId` match before using data.
- [Modal dismissal leaves user blocked at confirmation] -> Keep confirm disabled state explicit and surface repeat CTAs in banner/overlay.
- [Client-only persistence can be cleared by browser/privacy settings] -> Keep redirect URL as primary source; storage remains fallback only.
- [Additional UI state branches increase regression risk in booking page] -> Cover with focused client tests for banner/overlay/modal and seed behavior.

## Migration Plan

1. Ship discovery redirect fix and storage write helper first (backwards-compatible).
2. Ship reservation-page pending-booking hook usage with guarded seed logic.
3. Ship inline profile modal + booking-summary overlay gating.
4. Verify end-to-end flows:
   - guest with selected slot -> auth -> booking page slot retained
   - booking with incomplete profile -> modal completion -> summary unlocked
5. Rollback strategy:
   - disable modal invocation path and revert to existing link navigation for profile editing if needed.
   - retain redirect URL fix independently because it is low-risk and isolated.

## Open Questions

- Should fallback storage be cleared immediately after successful seed (instead of only post-booking) to reduce stale surface further?
- Should analytics events be added for profile-modal open/submit/cancel to quantify friction improvements?
