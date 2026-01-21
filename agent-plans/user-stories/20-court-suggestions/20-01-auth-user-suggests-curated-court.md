# US-20-01: Authenticated User Suggests a Curated Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **authenticated user**, I want to **suggest a curated court listing (a venue I already play at)** so that **the platform can expand its discovery catalog beyond admin-only submissions**.

---

## Acceptance Criteria

### Auth Required

- Given I am not authenticated
- When I try to access `/courts/suggest`
- Then I am redirected to login
- And after login I return to `/courts/suggest`

### Suggest Form Submission

- Given I am authenticated
- When I fill out the suggestion form with required fields
- And I submit
- Then the platform creates a new curated place in a pending approval state
- And I see an inline success state on `/courts/suggest`
- And I can click “Back to courts” to return to `/courts`

### Funnel Use Case (Missing Venue)

- Given I am browsing `/courts`
- And I cannot find a venue that I play at
- When I submit a suggestion
- Then the venue can be reviewed and added to the platform

### Sports Selection

- Given I am filling out the suggestion form
- When I select one or more sports
- Then the submission includes my selected sports
- And the platform creates placeholder court units for each selected sport

### Abuse Prevention (Rate Limit)

- Given I submit suggestions repeatedly in a short window
- When I exceed platform limits
- Then the platform rejects the request with a too many requests style error

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Duplicate suggestion (same name + city matches existing place) | Submission is blocked with a conflict message |
| Missing required fields | Form shows validation errors and does not submit |
| Invalid coordinates | Form shows validation error and does not submit |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Place name | text | Yes |
| Address | text | Yes |
| Province | select | Yes |
| City | select | Yes |
| Sports | multi-select (ids) | Yes |
| Latitude | text/number | No |
| Longitude | text/number | No |
| Time zone | text | No |
| Facebook URL | url | No |
| Instagram URL | url | No |
| Website URL | url | No |
| Viber info | text | No |
| Other contact info | textarea | No |

---

## References

- PRD: discovery supply growth (curated places)

Out of scope (handled in a later session): notifying the submitter when their suggestion is approved/rejected.
