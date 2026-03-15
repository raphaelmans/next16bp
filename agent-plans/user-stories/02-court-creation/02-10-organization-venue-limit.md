# US-02-10: Organization Venue Limit (Max 3)

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **create at most 3 venues per organization** so that **venue onboarding stays manageable during the current product phase**.

---

## Acceptance Criteria

### Owner Can Create Venues Until Limit Is Reached

- Given I am an organization owner
- And my organization has fewer than 3 venues
- When I create a new venue
- Then the venue is created successfully

### Venue Creation Is Blocked At 3 Venues

- Given I am an organization owner
- And my organization has 3 venues (active or inactive)
- When I attempt to create a new venue
- Then the platform blocks the request
- And I see a clear message that the organization has reached the maximum of 3 venues

### Owner UI Communicates The Limit

- Given my organization has 3 venues
- When I view the owner venues page
- Then I do not see an enabled "Add New Venue" action
- And I see guidance to delete an existing venue before adding another

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Organization has 3 inactive venues | Creation is still blocked (limit counts all venue records) |
| Two create requests happen concurrently near the limit | Platform enforces the max and prevents exceeding 3 |
| Owner deletes a venue | A new venue can be created once the organization is below 3 |
| Non-owner attempts to create a venue under another organization | Request is rejected as unauthorized |

---

## References

- Related: `src/app/(owner)/owner/places/page.tsx`
- Related: `src/modules/place/services/place-management.service.ts`
