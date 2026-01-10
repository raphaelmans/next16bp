# US-10-03: Owner Uploads Court Photos

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Court Owner**, I want to **upload photos of my courts** so that **players can see what the facilities look like before booking**.

---

## Acceptance Criteria

### Happy Path: Upload First Court Photo

- Given I am logged in as a court owner
- And I am editing one of my organization's courts
- When I click the photo upload area
- And I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then I see a preview of the selected image
- And when I save
- Then the image is uploaded to Supabase Storage
- And the photo is associated with the court
- And the photo appears in the court's photo gallery

### Happy Path: Upload Multiple Photos

- Given I am logged in as a court owner
- And I am editing a court that already has photos
- When I upload additional images
- Then each image is uploaded successfully
- And all photos appear in the court's gallery
- And I can reorder the photos (display order)

### Happy Path: Set Primary Photo

- Given I am logged in as a court owner
- And my court has multiple photos uploaded
- When I set a photo as the primary/featured image
- Then that photo is displayed first in listings
- And that photo is used as the thumbnail in search results

### Happy Path: Delete Court Photo

- Given I am logged in as a court owner
- And my court has photos uploaded
- When I click delete on a photo
- And I confirm the deletion
- Then the photo is removed from storage
- And the photo no longer appears in the gallery

### Validation: Cannot Upload for Others' Courts

- Given I am logged in as a court owner
- When I try to upload a photo for a court not owned by my organization
- Then I receive an authorization error
- And the file is not uploaded

### Validation: File Constraints

- Given I am logged in as a court owner
- When I select an image larger than 5MB
- Then I see an error message "File size must be less than 5MB"
- And when I select a non-image file
- Then I see an error message "Invalid file type"

### Display: Photos Visible to All Users

- Given a court has photos uploaded
- When any authenticated user views the court detail page
- Then they can see all the court photos
- And the photos load from the storage URL

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete last remaining photo | Allowed, court shows placeholder |
| Upload during slow connection | Show progress, allow cancel |
| Duplicate image upload | Allow (may want same photo) |
| Very large dimensions | Accept (storage handles it) |
| Photo order after deletion | Remaining photos reorder automatically |
| Court deleted with photos | Photos cleaned up (cascade or manual) |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Court Photos | file[] (images) | No |
| Display Order | number | Auto-assigned |
| Is Primary | boolean | First photo default |

---

## Technical Notes

- **Bucket:** `court-photos`
- **Path:** `{courtId}/{photoId}.{ext}`
- **Upsert:** No (multiple photos allowed)
- **Max Photos:** No limit (consider 20 for UX)
- **RLS Policy:**
  - SELECT: All authenticated users
  - INSERT: Owner of court's organization
  - UPDATE: Owner of court's organization
  - DELETE: Owner of court's organization

---

## Database Integration

Photos are tracked in `court_photo` table:
- `id` - UUID
- `court_id` - FK to court
- `url` - Storage URL
- `display_order` - Integer for ordering
- `created_at` - Timestamp

---

## References

- PRD: Section 5.2 (Curated Courts - Photos if available)
- PRD: Section 5.3 (Reservable Courts - Court detail)
- Existing schema: `src/shared/infra/db/schema/court-photo.ts`
