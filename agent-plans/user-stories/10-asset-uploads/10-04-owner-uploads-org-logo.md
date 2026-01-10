# US-10-04: Owner Uploads Organization Logo

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Court Owner**, I want to **upload my organization's logo** so that **players can easily identify my brand when viewing my courts**.

---

## Acceptance Criteria

### Happy Path: Upload Organization Logo

- Given I am logged in as a court owner
- And I am on my organization settings page
- When I click the logo upload area
- And I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then I see a preview of the selected logo
- And when I save my organization profile
- Then the logo is uploaded to Supabase Storage
- And my organization profile is updated with the logo URL
- And the logo appears on my organization's public profile

### Happy Path: Replace Existing Logo

- Given I am logged in as a court owner
- And my organization already has a logo
- When I upload a new logo image
- Then the old logo is replaced (upsert)
- And the organization shows the new logo
- And the old file is removed from storage

### Happy Path: Remove Logo

- Given I am logged in as a court owner
- And my organization has a logo uploaded
- When I click "Remove Logo"
- And I confirm the removal
- Then the logo is deleted from storage
- And my organization shows a placeholder/default icon

### Validation: File Constraints

- Given I am logged in as a court owner
- When I select an image larger than 5MB
- Then I see an error "File size must be less than 5MB"
- And when I select a non-image file
- Then I see an error "Invalid file type"

### Security: Cannot Upload for Other Organizations

- Given I am logged in as a court owner
- When I try to upload a logo for an organization I don't own
- Then I receive an authorization error
- And the file is not uploaded

### Display: Logo Visible to All Users

- Given an organization has a logo uploaded
- When any authenticated user views a court owned by that organization
- Then they can see the organization's logo
- And the logo loads from the storage URL

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Upload non-square image | Accept, display may crop/fit |
| Very small image (< 64px) | Accept with quality warning |
| Transparent PNG | Preserve transparency |
| Animated GIF | Accept first frame only |
| Organization deleted | Logo cleaned up |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Organization Logo | file (image) | No |

---

## Technical Notes

- **Bucket:** `organization-assets`
- **Path:** `{organizationId}/logo.{ext}`
- **Upsert:** Yes (single logo per org)
- **RLS Policy:**
  - SELECT: All authenticated users
  - INSERT: Organization owner only
  - UPDATE: Organization owner only
  - DELETE: Organization owner only

---

## Database Integration

Logo URL stored in `organization_profile` table:
- `logo_url` - Text field for storage URL

---

## References

- PRD: Section 12.3 (Organization Profile - Logo)
- Existing schema: `src/shared/infra/db/schema/organization.ts`
