# US-02-09: Owner Deletes Place

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **delete a place from the owner edit page** so that **the listing is removed while reservations remain available for audit purposes**.

---

## Acceptance Criteria

### Delete Action Is Available On Edit Page

- Given I am an owner on `/owner/places/{placeId}/edit`
- When the page loads
- Then I see a Danger Zone section with a Delete Place action

### Delete Requires Explicit Confirmation

- Given I click Delete Place
- When the confirmation dialog opens
- Then I must type the place name to enable the destructive action

### Deleting Removes Place Records But Retains Reservations

- Given I confirm deletion
- When the delete request succeeds
- Then the place record is deleted along with related place data (photos, amenities, verification, contact detail)
- And courts linked to the place are detached (place_id set to null)
- And reservations/time slots remain stored for audit purposes

### Owner Is Redirected After Deletion

- Given the delete request succeeds
- Then I am redirected to `/owner/places`
- And I see a success toast
- And the deleted place no longer appears in owner lists

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place has active or past reservations | Deletion is still allowed; reservations remain stored | 
| Place is already deleted | Show not-found and return to `/owner/places` |
| Network error during delete | Show error toast and keep dialog open |
| Typed confirmation does not match | Delete action stays disabled |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Confirmation Text | text | Yes |

---

## References

- Related: `agent-plans/52-owner-place-deletion/52-00-overview.md`
