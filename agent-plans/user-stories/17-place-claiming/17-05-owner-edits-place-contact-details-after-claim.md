# US-17-05: Owner Edits Place Contact Details After Claim

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **edit my place's contact details after claiming** so that **the public listing stays accurate and players can reach us through the correct channels**.

---

## Acceptance Criteria

### View Contact Details in Owner Edit

- Given I own a place
- When I open the place edit page
- Then I can see editable contact fields (website, Facebook, Instagram, Viber info, other)

### Save Contact Details

- Given I update contact fields
- When I save the place
- Then the updated contact details are persisted
- And they are visible on the public place page

### Preserve Place Ownership Rules

- Given I do not own the place
- When I attempt to edit its contact details
- Then I am blocked from editing

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Owner clears a contact field | The field is removed from the public display |
| Invalid URL provided | Block save with validation error |
| Concurrent edits | Last write wins (standard update behavior) |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Website URL | url | No |
| Facebook URL | url | No |
| Instagram URL | url | No |
| Viber Info | text | No |
| Other Contact Info | textarea | No |

---

## References

- PRD: Owners can manage listing details after claiming
