# US-00-02: User Completes Profile

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user**, I want to **complete my profile with minimal information** so that **I can make reservations and optionally become a court owner**.

---

## Acceptance Criteria

### View Profile

- Given I am authenticated
- When I navigate to `/account/profile`
- Then I see my current profile information (display name, email, phone, avatar)

### Update Profile

- Given I am on `/account/profile`
- When I update any field and click Save
- Then my profile is updated and I see a success toast

### Profile Auto-Creation

- Given I am a new user with no profile
- When I first access `/account/profile` or `/home`
- Then a profile is automatically created for me (empty fields)

### Minimum Required for Booking

- Given I try to book a court
- When my profile is missing display name AND (email AND phone)
- Then I am prompted to complete minimum fields before proceeding

### Become Owner CTA

- Given I am on `/account/profile` and have no organization
- When I view the page
- Then I see a "Want to list your courts?" CTA section

---

## Edge Cases

- Display name too short (< 1 char) - Show validation error
- Invalid email format - Show validation error
- Phone number invalid format - Show validation error
- Profile update fails - Show error toast, preserve form state
- User has organization - Hide "Become Owner" CTA, show org link instead

---

## Profile Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Display Name | text | For booking | 1-100 chars |
| Email | email | Either email or phone | Valid email format |
| Phone Number | tel | Either email or phone | Max 20 chars |
| Avatar URL | url | No | Valid URL |

---

## Profile Completeness

**Minimum for Booking:**
- Display name (required)
- Email OR phone (at least one)

**Complete Profile:**
- Display name
- Email
- Phone
- Avatar (optional, not counted)

---

## References

- PRD: Section 11 (Player Profiles)
- Design System: `business-contexts/kudoscourts-design-system.md`
- Context: `agent-contexts/00-01-kudoscourts-server.md`
