# US-20-04: Public Courts Page Provides “Suggest a Court” CTA

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user browsing courts**, I want a **“Suggest a court” entry point** so that **I can contribute listings when I don’t see a venue**.

---

## Acceptance Criteria

### CTA Visible

- Given I am on `/courts`
- When I view the page header and/or empty results state
- Then I see a “Suggest a court” action

### Unauthenticated Behavior

- Given I am not logged in
- When I click “Suggest a court”
- Then I am redirected to login with a redirect back to `/courts/suggest`

### Authenticated Behavior

- Given I am logged in
- When I click “Suggest a court”
- Then I am taken to `/courts/suggest`
