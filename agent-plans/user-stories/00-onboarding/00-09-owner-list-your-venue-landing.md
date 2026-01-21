# US-00-09: Owner Uses "List Your Venue" Landing

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want a **public "List your venue" page that explains the onboarding steps and starts registration**, so that **I can register and verify my venue smoothly without getting lost in the setup flow**.

---

## Acceptance Criteria

### Landing Page Access

- Given I am on the public website
- When I visit the "List your venue" page
- Then I can understand the onboarding steps (organization, venue, first court, verification)
- And I can start onboarding from a clear primary CTA

### Seamless Continuation

- Given I click the primary CTA
- When I am required to sign in
- Then I can sign in and continue onboarding without losing my place

### Existing Owner

- Given I already have an organization
- When I access the onboarding entrypoint from the landing page
- Then I am routed to the next step of setup (adding a venue) instead of being blocked or re-registering

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User is signed in but not an owner yet | CTA starts organization onboarding |
| User already has an organization | CTA continues to the next setup step |
| CTA continuation target is invalid | Fallback to the default next step (venue creation) |

---

## References

- Plan: `agent-plans/48-owner-onboarding-court-verification/48-00-overview.md`
- Design System: `business-contexts/kudoscourts-design-system.md`
