# US-10-01: Player Uploads Profile Avatar

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **Player**, I want to **upload a profile picture** so that **court owners can recognize me when I make reservations**.

---

## Acceptance Criteria

### Happy Path: First-time Avatar Upload

- Given I am logged in as a player
- And I am on my profile settings page
- When I click the avatar upload area
- And I select a valid image file (JPEG, PNG, or WebP under 5MB)
- Then I see a preview of the selected image
- And when I save my profile
- Then the image is uploaded to Supabase Storage
- And my profile is updated with the new avatar URL
- And I see my new avatar displayed

### Happy Path: Replace Existing Avatar

- Given I am logged in as a player
- And I already have an avatar uploaded
- When I upload a new image
- Then the old avatar is replaced (upsert)
- And my profile shows the new avatar
- And the old file is no longer accessible

### Happy Path: Drag and Drop Upload

- Given I am logged in as a player
- And I am on my profile settings page
- When I drag and drop an image file onto the upload area
- Then the file is accepted and preview is shown
- And the upload proceeds as normal

### Validation: File Too Large

- Given I am logged in as a player
- When I select an image file larger than 5MB
- Then I see an error message "File size must be less than 5MB"
- And the file is not uploaded

### Validation: Invalid File Type

- Given I am logged in as a player
- When I select a non-image file (PDF, video, etc.)
- Then I see an error message "Invalid file type. Please upload JPEG, PNG, or WebP"
- And the file is not uploaded

### Security: Cannot View Other Users' Avatars via Direct Path

- Given I am logged in as a player
- When I try to access another user's avatar via a guessed storage path
- Then I receive an access denied error
- And the image is not returned

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Network error during upload | Show error toast, allow retry |
| Upload in progress, user navigates away | Cancel upload, no partial file stored |
| Very slow connection | Show upload progress indicator |
| Browser doesn't support drag-drop | File picker still works via click |
| Image with EXIF rotation | Display correctly oriented preview |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Avatar | file (image) | No |

---

## Technical Notes

- **Bucket:** `avatars`
- **Path:** `{userId}/avatar.{ext}`
- **Upsert:** Yes (replace existing)
- **RLS Policy:** User can only access their own avatar

---

## References

- PRD: Section 11.2 (Profile Attributes - Avatar)
- Existing component: `src/shared/components/kudos/file-upload.tsx`
