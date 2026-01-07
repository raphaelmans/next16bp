# US-02-02: Owner Creates Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **create my own court** so that **players can discover and book it through the platform**.

---

## Acceptance Criteria

### Access Form

- Given I am an owner on `/owner/courts`
- When I click "Add Court"
- Then I navigate to `/owner/courts/new`

### Create Court

- Given I am on `/owner/courts/new`
- When I fill required fields and submit
- Then a court is created with `type: RESERVABLE`, linked to my organization

### Set Default Pricing

- Given I am creating a court
- When I configure a default hourly rate and currency
- Then these defaults are saved for new time slots

### Add Photos

- Given I am creating a court
- When I add photo URLs
- Then photos are saved and associated with the court

### Add Amenities

- Given I am creating a court
- When I select amenities from the list
- Then amenities are linked to the court

### Post-Creation Redirect

- Given I successfully create a court
- When the form submits
- Then I am redirected to `/owner/courts/[id]/slots` to manage availability

### View in Discovery

- Given my court is created
- When a player searches on `/courts`
- Then my court appears (shows "No availability" until slots are added)

### No Organization

- Given I have no organization
- When I try to access `/owner/courts/new`
- Then I am redirected to `/owner/onboarding`

### Navigation

- Given I am on `/owner/courts/new`
- When I click Cancel or the back button
- Then I return to `/owner/courts`

---

## Edge Cases

- Missing required field - Show inline validation error
- Invalid photo URL - Show validation error
- Owner has no organization - Redirect to onboarding
- Court created but no slots - Shows in discovery with "No availability"
- Network error on submit - Show error toast, preserve form state

---

## Form Fields

### Required

| Field | Type | Validation |
|-------|------|------------|
| Name | text | 1-150 chars |
| Address | text | 1-200 chars |
| City | text | 1-100 chars |

### Optional

| Field | Type | Validation |
|-------|------|------------|
| Description | textarea | Max 1000 chars |
| Photos | url[] | Valid URLs |
| Amenities | multi-select | From predefined list |
| Default Hourly Rate | number | Min 0 |
| Currency | select | ISO 4217 (default: PHP) |

---

## Post-Creation Flow

```
/owner/courts/new
    │
    ▼
[Create Court] ─── Success toast
    │
    ▼
/owner/courts/[id]/slots
    │
    ▼
Add time slots to enable booking
```

---

## API Endpoint

| Endpoint | Method | Input |
|----------|--------|-------|
| `courtManagement.createCourt` | Mutation | `{ name, address, city, description?, photos?, amenities?, defaultPrice?, currency? }` |

**Note:** This endpoint may need to be created if it doesn't exist. Currently only `adminCourt.createCuratedCourt` exists.

---

## References

- PRD: Section 5.3 (Reservable Courts)
- Design System: Section 5.2 (Cards), 5.6 (Form Inputs)
- Context: `agent-contexts/00-01-kudoscourts-server.md`
