# US-02-01: Admin Creates Curated Court

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **admin**, I want to **create a curated court listing** so that **players can discover courts before owners onboard the platform**.

---

## Acceptance Criteria

### Access Form

- Given I am an admin on `/admin/courts`
- When I click "Add Court"
- Then I navigate to `/admin/courts/new`

### Create Court

- Given I am on `/admin/courts/new`
- When I fill required fields (name, address, city) and submit
- Then a court is created with `type: CURATED`, `claimStatus: UNCLAIMED`

### Add Photos

- Given I am creating a court
- When I add photo URLs
- Then photos are saved and associated with the court

### Add Amenities

- Given I am creating a court
- When I select amenities from the list
- Then amenities are linked to the court

### Add Contact Socials

- Given I am creating a curated court
- When I add contact links (Facebook, Viber, Instagram, website)
- Then these are saved in the curated court detail

### View in Discovery

- Given a curated court is created
- When a player searches on `/courts`
- Then the court appears in results with "Contact to Book" label

### Navigation

- Given I am on `/admin/courts/new`
- When I click Cancel or the back button
- Then I return to `/admin/courts`

---

## Edge Cases

- Missing required field - Show inline validation error
- Invalid photo URL - Show validation error
- Duplicate court name in same city - Allow (not a unique constraint)
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
| Facebook URL | url | Valid URL |
| Viber | text | Phone or link |
| Instagram | text | Handle or URL |
| Website | url | Valid URL |

---

## Curated Court Display

Players see curated courts with:
- Court name and location
- Photos (or placeholder)
- Amenities badges
- "Contact to Book" badge (not a reserve button)
- Social/contact links to reach the owner externally

---

## API Endpoint

| Endpoint | Method | Input |
|----------|--------|-------|
| `adminCourt.createCuratedCourt` | Mutation | `{ name, address, city, description?, photos?, amenities?, socials? }` |

---

## References

- PRD: Section 5.2 (Curated Courts)
- Design System: Section 5.2 (Cards), 5.3 (Badges)
- Context: `agent-contexts/00-01-kudoscourts-server.md`
