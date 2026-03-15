# Developer 1 Checklist

**Focus Area:** Owner places logo card + upload flow  
**Modules:** 1A

---

## Module 1A: Owner places logo card

**Reference:** `49-01-owner-places-logo-upload.md`  
**User Story:** `US-10-04`

### Setup

- [ ] Confirm `organization.uploadLogo` endpoint exists.
- [ ] Confirm `organization.get` returns `profile.logoUrl`.

### Implementation

- [ ] Add logo card to `src/app/(owner)/owner/places/page.tsx`.
- [ ] Wire `useUploadOrganizationLogo` mutation with FormData.
- [ ] Add file validation (type + size) with toasts.

### Testing

- [ ] Upload valid PNG/JPG/WebP under 5MB.
- [ ] Reject invalid file types/sizes.
- [ ] Logo preview reflects server update.

### Handoff

- [ ] Update overview success criteria if scope changes.
- [ ] Notify team if removal support is still pending.
