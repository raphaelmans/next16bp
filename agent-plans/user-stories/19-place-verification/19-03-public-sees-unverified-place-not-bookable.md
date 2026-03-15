# US-19-03: Public Sees Unverified Place (Discoverable, Not Bookable)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **player (public visitor)**, I want to **discover and view unverified places but not be able to book them** so that **the platform remains useful for discovery while preventing reservations on unverified listings**.

---

## Acceptance Criteria

### Unverified Places Are Discoverable

- Given a place is active
- When I browse/search places
- Then unverified places can appear in results

### Place Detail Shows Verification Status

- Given I open a place detail page
- When the place is unverified or verification is pending
- Then I see a clear status indicator (e.g., "Unverified" / "Verification Pending")

### Booking Is Disabled

- Given I am on a place detail page for a place that is not verified
- When I attempt to book (CTA or booking route)
- Then I cannot complete a booking
- And I see a clear message explaining that reservations are not enabled for this place

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is verified but reservations are not enabled | Show "Reservations not enabled" and disable booking |
| Place is rejected | Show "Verification rejected" and disable booking |
| User hits booking endpoint directly | Server blocks the request and returns a user-safe error |

---

## References

- PRD: Curated places are discoverable but not bookable until approved (apply same concept to unverified owner-created places)
