# US-01-01: Owner Registers Organization

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **user**, I want to **create an organization** so that **I can list and manage my pickleball courts on the platform**.

---

## Acceptance Criteria

### Access Onboarding

- Given I am authenticated and have no organization
- When I click the "Become a Court Owner" CTA on `/home` or `/account/profile`
- Then I navigate to `/owner/onboarding`

### Create Organization

- Given I am on `/owner/onboarding`
- When I enter an organization name and submit
- Then an organization is created with auto-generated slug
- And I am redirected to `/owner`

### Custom Slug

- Given I am on `/owner/onboarding`
- When I provide a custom slug
- Then the system validates it is unique
- And uses my custom slug if valid

### Auto-Generated Slug

- Given I submit organization name "My Sports Complex"
- When no custom slug is provided
- Then the slug is generated as "my-sports-complex"

### Slug Conflict

- Given the slug "my-courts" already exists
- When I try to use it
- Then the system appends a number: "my-courts-1"

### Access Owner Dashboard

- Given my organization is created
- When I visit `/owner`
- Then I see the owner dashboard with my organization

### Already Has Organization

- Given I already have an organization
- When I try to access `/owner/onboarding`
- Then I am redirected to `/owner`

---

## Edge Cases

- Organization name too short (< 1 char) - Show validation error
- Organization name too long (> 150 chars) - Show validation error
- Slug format invalid (not lowercase alphanumeric with hyphens) - Show validation error
- Slug already exists - Auto-append number or show error for custom slug
- Rate limiting triggered - Show "Too many requests" error
- Network error - Show error toast with retry

---

## Onboarding Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Logo]                                        [Cancel →]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  Create Your Organization                   │
│                  Font: Outfit 700, h1                       │
│                                                             │
│  Start listing your pickleball courts and                   │
│  accepting reservations.                                    │
│  Font: Source Sans 3 400, muted-foreground                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Organization Name *                                   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ My Sports Complex                               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ This will be displayed to players                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ URL Slug (optional)                                   │  │
│  │ ┌─────────────────────────────────────────────────┐   │  │
│  │ │ my-sports-complex                               │   │  │
│  │ └─────────────────────────────────────────────────┘   │  │
│  │ kudoscourts.com/org/my-sports-complex                 │  │
│  │ Leave blank to auto-generate from name                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│                           [Create Organization]             │
│                           Primary Button                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Organization Name | text | Yes | 1-150 chars |
| Slug | text | No | Lowercase, alphanumeric, hyphens only, 1-100 chars |

---

## Post-Creation Flow

```
/owner/onboarding
    │
    ▼
[Create Organization]
    │
    ▼
/owner (Dashboard)
    │
    ▼
Add first court: /owner/courts/new
```

---

## API Endpoint

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `organization.create` | Mutation | `{ name, slug? }` | `{ organization, profile }` |

---

## References

- PRD: Section 12 (Organization Management)
- Design System: Section 5.6 (Form Inputs)
- Context: `agent-contexts/00-01-kudoscourts-server.md`
