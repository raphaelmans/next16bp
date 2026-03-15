# US-10-06: Owner Uploads Place Photos

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Place Owner**, I want to **upload and manage photos for my place** so that **players can see what the venue looks like before booking**.

---

## Acceptance Criteria

### Happy Path: Upload First Place Photo

- Given I am logged in as an owner
- And I am editing one of my places
- When I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then the image is uploaded successfully
- And the photo is associated with the place
- And the photo appears in the place photo gallery on the public place page
- And the uploaded photo becomes the cover photo (first in order)

### Happy Path: Upload Multiple Photos

- Given I am logged in as an owner
- And I am editing a place that already has photos
- When I upload additional images
- Then each image is uploaded successfully
- And all photos appear in the place gallery
- And I can reorder photos

### Happy Path: Set Cover Photo

- Given I am logged in as an owner
- And the place has multiple photos
- When I set a photo as the cover photo
- Then it appears first in the ordered list
- And it is used as the cover image wherever a cover image is shown

### Happy Path: Delete Place Photo

- Given I am logged in as an owner
- And the place has photos uploaded
- When I delete a photo
- Then the photo record is removed
- And the underlying storage object is deleted
- And the photo no longer appears in the public place gallery

### Validation: Cannot Upload for Others' Places

- Given I am logged in as an owner
- When I try to upload a photo for a place not owned by my organization
- Then I receive an authorization error
- And the file is not uploaded

### Validation: File Constraints

- Given I am logged in as an owner
- When I select an image larger than 5MB
- Then I see an error message indicating the file is too large
- And when I select a non-image file
- Then I see an error message indicating the file type is invalid

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete last remaining photo | Allowed, gallery shows placeholder |
| Upload during slow connection | Show progress, allow retry |
| Duplicate image upload | Allow |
| Very large dimensions | Accept (no resizing in MVP) |
| Reorder after deletion | Remaining photos reorder correctly |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Place Photo | file (image) | No |
| Display Order | number | Auto-assigned |
| Cover Photo | boolean | Derived from order (first photo) |

---

## References

- PRD: Section 5 (Place Types & Behavior) — place detail includes photos
- Existing schema: `src/shared/infra/db/schema/place-photo.ts`
