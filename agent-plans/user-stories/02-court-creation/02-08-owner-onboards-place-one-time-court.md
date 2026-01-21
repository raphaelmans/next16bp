# US-02-08: Owner Onboards Place With One-Time Court Creation

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **create my first court immediately after creating a place and then proceed to place verification** so that **I can complete the minimum onboarding path (place -> court -> verification) without being forced through schedule/pricing/slot setup**.

---

## Acceptance Criteria

### Place Creation Redirects Into One-Time Court Creation

- Given I am an owner on `/owner/places/new`
- When I submit the place creation form successfully
- Then I am redirected to `/owner/places/{placeId}/courts/new`

### One-Time Court Creation Page Is Court-Only

- Given I am on `/owner/places/{placeId}/courts/new`
- When the page loads
- Then I see a court details form (no schedule/pricing/slots steps)
- And the place is preselected and cannot be changed

### Court Creation Redirects To Verification

- Given I am on `/owner/places/{placeId}/courts/new`
- When I submit the court form successfully
- Then a court is created for `{placeId}`
- And I am redirected to `/owner/verify/{placeId}`
- And I see a success toast

### Cancel Returns To Courts List

- Given I am on `/owner/places/{placeId}/courts/new`
- When I click Cancel
- Then I am redirected to `/owner/places/{placeId}/courts`
- And no court is created

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place does not exist or is not accessible | User is redirected to `/owner/places` (or sees a not-found state) |
| Sports list is empty | Submit is blocked and an empty-state message is shown |
| Network error while creating court | Show error toast; keep form values |
| Refresh on `/owner/places/{placeId}/courts/new` | Page remains usable (still court-only) |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Place | select (locked) | Yes |
| Sport | select | Yes |
| Court Label | text | Yes |
| Tier Label | text | No |

---

## References

- Related: `agent-plans/user-stories/02-court-creation/02-05-owner-creates-court-wizard.md`
- Related: `agent-plans/user-stories/19-place-verification/19-01-owner-submits-place-verification-request.md`
