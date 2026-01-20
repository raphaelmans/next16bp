# US-19-04: Verified Owner Enables Reservation Support

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **enable reservation support for a verified place** so that **players can start booking once I'm ready to accept reservations**.

---

## Acceptance Criteria

### Enable Reservations Only After Verification

- Given I am an authenticated owner
- When a place is not verified
- Then I cannot enable reservation support

### Owner Can Enable Reservations

- Given I am an authenticated owner
- And the place is verified
- When I enable reservation support
- Then the place becomes bookable for players

### Owner Can Disable Reservations

- Given I am an authenticated owner
- And reservation support is enabled
- When I disable reservation support
- Then the place is no longer bookable

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is verified but has no published slots | Place is enabled but players see no availability |
| Owner loses access to org (ownership change) | Owner can no longer enable/disable reservations |

---

## References

- Trust requirement: verification is a prerequisite for reservation support
