# Phase 1: Owner hub logo upload + data wiring

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-10-04

---

## Objective

Make organization logo upload discoverable from the owner places hub and ensure the logo renders consistently across discovery cards and public detail views.

---

## Module 1A: Owner places logo card

**Reference:** `49-00-overview.md`

### UI Layout

```
┌─────────────────────────────────────────────┐
│ Organization Logo            [Upload logo] │
│ Shown on all your places and public pages  │
│                                             │
│ [Logo Avatar]  Org name                     │
│ PNG/JPG/WebP up to 5MB                      │
└─────────────────────────────────────────────┘
```

### Flow Diagram

```
/owner/places
    │
    ▼
[Upload logo] → file picker → uploadLogo
    │
    ▼
Toast success + data refresh
```

### Implementation Steps

1. Add logo card to `src/app/(owner)/owner/places/page.tsx`.
2. Fetch `organization.get` to read `profile.logoUrl` for preview.
3. Use `useUploadOrganizationLogo` with FormData for upload.
4. Validate file type/size client-side and show toasts on failure.

### Code Example

```tsx
const uploadLogo = useUploadOrganizationLogo(organizationId);
const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("organizationId", organizationId);
  formData.append("image", file, file.name);
  await uploadLogo.mutateAsync(formData);
};
```

### Testing Checklist

- [ ] Upload succeeds with PNG/JPG/WebP under 5MB.
- [ ] Invalid type/size shows toast and does not upload.
- [ ] Logo preview renders after upload (query invalidated).
- [ ] Lint/build pass.

---

## Phase Completion Checklist

- [ ] Owner places logo card shipped.
- [ ] Data refresh on upload.
- [ ] Lint/build pass.
