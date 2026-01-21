# Developer 1 Checklist

**Focus Area:** Admin place transfer workflow  
**Modules:** 1A, 1B, 1C, 2A

---

## Module 1A: Admin Organization Search

**Reference:** `51-01-admin-transfer-backend.md`  
**User Story:** `US-17-06`  
**Dependencies:** None

### Setup

- [ ] Add admin organization repository + service
- [ ] Wire `admin.organization.search` router

### Implementation

- [ ] Implement search query (name/slug, active filter)
- [ ] Return lightweight org fields for picker

### Testing

- [ ] Verify search returns expected organizations

---

## Module 1B: Transfer Mutation + Verification

**Reference:** `51-01-admin-transfer-backend.md`  
**User Story:** `US-17-06`  
**Dependencies:** Module 1A

### Implementation

- [ ] Add transfer DTO and admin mutation
- [ ] Update place ownership + claim status
- [ ] Upsert verification when auto-verify enabled
- [ ] Log `place.transferred` event

### Testing

- [ ] Transfer updates place org + claim status
- [ ] Auto-verify sets verification to VERIFIED + enabled

---

## Module 1C: Ownership Enrichment

**Reference:** `51-01-admin-transfer-backend.md`  
**User Story:** `US-17-06`

### Implementation

- [ ] Join organization name in admin courts list
- [ ] Include organization summary in admin court detail
- [ ] Map organization name in admin hook

---

## Module 2A: Ownership Card + Transfer Dialog

**Reference:** `51-02-admin-transfer-ui.md`  
**User Story:** `US-17-06`

### Implementation

- [ ] Add ownership card to admin court edit page
- [ ] Add transfer dialog with org search + auto-verify toggle
- [ ] Copy owner login link action
- [ ] Invalidate admin court list/detail on success

### Testing

- [ ] Transfer dialog works end-to-end
- [ ] Copy owner link writes to clipboard

---

## Final Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`
- [ ] Manual transfer test in admin UI
