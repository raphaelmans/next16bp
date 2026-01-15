# US-17-01: Admin Curates Place With Explicit Courts

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **create a curated place with explicit courts (multi-sport)** so that **players can discover venues accurately before owners onboard**.

---

## Acceptance Criteria

### Create Curated Place

- Given I am an authenticated admin
- When I create a curated place with required place fields
- Then the place is created as a curated listing

### Add Explicit Courts

- Given I am creating a curated place
- When I add one or more courts with labels and sports
- Then the courts are saved as part of the curated place inventory

### Multi-sport Support

- Given I am creating a curated place
- When I add courts with different sports
- Then the place is discoverable as a multi-sport venue

### Add Contact Info

- Given I am creating a curated place
- When I add contact details (e.g., website, Facebook, Instagram, Viber info)
- Then those contact details are saved and visible on the public place page

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No courts provided | Block submission with validation error |
| Invalid sport selection | Block submission with validation error |
| Duplicate court label within a place | Allow, but admin can correct (no forced uniqueness) |
| Invalid contact URL | Block submission with validation error |

---

## Form Fields

### Place

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Address | text | Yes |
| City | select/text | Yes |
| Latitude | number/text | No |
| Longitude | number/text | No |
| Time Zone | select | No |

### Courts

| Field | Type | Required |
|-------|------|----------|
| Courts | list | Yes |
| Court Label | text | Yes |
| Sport | select | Yes |
| Tier Label | text | No |

### Contact

| Field | Type | Required |
|-------|------|----------|
| Website URL | url | No |
| Facebook URL | url | No |
| Instagram URL | url | No |
| Viber Info | text | No |
| Other Contact Info | textarea | No |

---

## References

- PRD: Curated discovery inventory and owner onboarding
