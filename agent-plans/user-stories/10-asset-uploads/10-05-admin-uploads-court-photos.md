# US-10-05: Admin Uploads Court Photos

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Platform Admin**, I want to **upload photos for curated courts** so that **players can see what the court looks like even when the owner hasn't claimed it yet**.

---

## Acceptance Criteria

### Happy Path: Upload Photo for Curated Court

- Given I am logged in as an admin
- And I am editing a curated (unclaimed) court
- When I click the photo upload area
- And I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then I see a preview of the selected image
- And when I save
- Then the image is uploaded to Supabase Storage
- And the photo is associated with the court
- And players can see the photo on the court detail page

### Happy Path: Upload Photos for Any Court

- Given I am logged in as an admin
- When I edit any court (curated or reservable)
- Then I can upload photos regardless of ownership
- And the photos are saved successfully

### Happy Path: Manage Multiple Photos

- Given I am logged in as an admin
- And I am editing a court
- When I upload multiple images
- Then all images are uploaded successfully
- And I can reorder or delete any of them

### Happy Path: Delete Court Photo

- Given I am logged in as an admin
- And a court has photos uploaded
- When I delete a photo
- Then the photo is removed from storage
- And it no longer appears in the gallery

### Photos Persist After Claiming

- Given a curated court has photos uploaded by an admin
- When an owner claims the court
- And the claim is approved
- Then the existing photos remain on the court
- And the new owner can manage those photos

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Admin uploads, owner later deletes | Owner has full control after claim |
| Bulk upload for data entry | Sequential uploads (no batch API) |
| Court transitions back to curated | Photos remain |
| Admin deletes then re-uploads | Normal flow, new file IDs |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Court Photos | file[] (images) | No |
| Display Order | number | Auto-assigned |

---

## Technical Notes

- **Bucket:** `court-photos`
- **Path:** `{courtId}/{photoId}.{ext}`
- **Upsert:** No (multiple photos allowed)
- **RLS Policy:**
  - SELECT: All authenticated users
  - INSERT: Admin role (any court)
  - UPDATE: Admin role (any court)
  - DELETE: Admin role (any court)

---

## Relationship to US-10-03

This story extends the court photo functionality to admins:

| Capability | Owner (US-10-03) | Admin (US-10-05) |
|------------|------------------|------------------|
| Upload photos | Own courts only | Any court |
| Delete photos | Own courts only | Any court |
| Reorder photos | Own courts only | Any court |
| View photos | All courts | All courts |

---

## References

- PRD: Section 4.3 (Platform Admin - Manage curated court inventory)
- PRD: Section 5.2 (Curated Courts - Photos if available)
