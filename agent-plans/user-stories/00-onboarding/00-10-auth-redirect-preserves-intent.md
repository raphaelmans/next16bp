# US-00-10: Auth Redirect Preserves Intent

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user signing in or confirming email**, I want the platform to **return me to the exact page I intended**, so that **I can continue onboarding or booking without losing context**.

---

## Acceptance Criteria

### Password Sign In

- Given I am redirected to sign in
- When I complete password login
- Then I return to the page that required authentication

### Google OAuth

- Given I choose Google sign in
- When I complete OAuth successfully
- Then I return to the intended page

### Email Confirmation / Magic Link

- Given I confirm my email or click a magic link
- When authentication completes
- Then I return to the intended page

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Redirect parameter is missing | Redirect to a safe default (home) |
| Redirect parameter is malformed or external | Redirect to a safe default (home) |
| Redirect parameter includes query/hash | Preserve query/hash when returning |

---

## References

- Plan: `agent-plans/56-auth-redirect-continuity/56-00-overview.md`
- Design System: `business-contexts/kudoscourts-design-system.md`
