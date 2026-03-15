# US-02-07: Admin Batch Curated Court Entry

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -  
**Related:** US-02-01 (Admin Creates Curated Court), US-02-03 (Admin Data Entry Form)

---

## Story

As an **admin or data entry staff**, I want to **add multiple curated courts in a single batch form** so that **I can populate inventory faster without repeating single-entry steps**.

---

## Overview

A batch-entry admin portal that allows multiple curated courts to be submitted in one action, with per-row validation, optional coordinates, and full metadata (contact info, amenities, and photos).

---

## Acceptance Criteria

### Access Batch Form

- Given I am an admin on `/admin/courts`
- When I click "Batch Add"
- Then I navigate to `/admin/courts/batch`

### Add Multiple Rows

- Given I am on `/admin/courts/batch`
- When I add or remove rows
- Then I can maintain a batch of curated courts to submit together

### Create Courts in Batch

- Given I submit a batch with valid rows
- When the batch mutation succeeds
- Then each row creates a curated place with `type: CURATED` and `claimStatus: UNCLAIMED`
- And I see a summary of created, skipped, and failed rows

### Optional Coordinates

- Given I leave latitude/longitude empty in a row
- When I submit the batch
- Then the place is created with no coordinates stored

### Full Metadata Support

- Given I enter contact info, amenities, or photo URLs
- When I submit the batch
- Then the curated place includes those details in the created records

### Duplicate Handling

- Given a row matches an existing place by **name + city**
- When I submit the batch
- Then the row is skipped and reported as a duplicate

### Validation

- Given I submit with missing required fields or invalid URLs
- Then I see inline validation errors and the batch is not submitted

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Duplicate rows within the same batch | Skip duplicates and report in results |
| Network error during submit | Show error toast, preserve form state |
| One row fails while others succeed | Return per-row status, allow partial success |
| Invalid photo URL | Show validation error |

---

## Form Fields

### Required

| Field | Type | Required |
|-------|------|----------|
| Name | text | Yes |
| Address | text | Yes |
| City | select | Yes |

### Optional - Location

| Field | Type | Required |
|-------|------|----------|
| Latitude | text | No |
| Longitude | text | No |

### Optional - Contact

| Field | Type | Required |
|-------|------|----------|
| Facebook URL | text | No |
| Instagram URL | text | No |
| Viber Contact | text | No |
| Website URL | text | No |
| Other Contact Info | textarea | No |

### Optional - Amenities

| Field | Type | Required |
|-------|------|----------|
| Amenities | multi-select | No |

### Optional - Photos

| Field | Type | Required |
|-------|------|----------|
| Photo URLs | multiline text | No |

---

## References

- PRD: `business-contexts/kudoscourts-prd-v1.2.md` (Sections 4.3, 5.2)
