
**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-17-06

---

## Objective

Provide admin-side APIs and data enrichment to transfer places to organizations, optionally auto-verify, and surface organization ownership in admin listings.

---

## Modules

### Module 1A: Admin Organization Search

**User Story:** `US-17-06`  
**Reference:** `51-00-overview.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `admin.organization.search` | Query | `{ query?, limit, offset, includeInactive? }` | `{ items, total }` |

#### Implementation Steps

1. Add admin organization repository + service for searchable lists.
2. Expose `admin.organization.search` in tRPC root.
3. Return `id`, `name`, `slug`, and `isActive` for the picker.

---

### Module 1B: Transfer Mutation + Verification

**User Story:** `US-17-06`  
**Reference:** `51-00-overview.md`

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `admin.court.transfer` | Mutation | `{ placeId, targetOrganizationId, autoVerifyAndEnable }` | `{ place }` |

#### Implementation Steps

1. Lock place row for update and validate target organization.
2. Update `organizationId`, `placeType=RESERVABLE`, `claimStatus=CLAIMED`.
3. If `autoVerifyAndEnable`, upsert `place_verification` to VERIFIED + enabled.
4. Log `place.transferred` business event.

---

### Module 1C: Ownership Enrichment

**User Story:** `US-17-06`  
**Reference:** `51-00-overview.md`

#### API Updates

| Layer | Change |
|-------|--------|
| `AdminCourtRepository.findAll` | Join organization name for admin list |
| `AdminCourtRepository.findDetailsById` | Include organization summary in detail response |
| Admin courts hook | Map `organizationName` into list items |

#### Implementation Steps

1. Left-join organization name in admin list query.
2. Add organization summary to admin detail response.
3. Update admin courts hook mapping for `organizationName`.

---

## Testing Checklist

- [ ] `admin.organization.search` returns matching organizations
- [ ] Transfer mutation updates place ownership and claim status
- [ ] Auto-verify sets `place_verification` to VERIFIED + enabled
- [ ] Admin courts list shows organization name when present

---

## Phase Completion Checklist

- [ ] Backend APIs for org search and transfer exist
- [ ] Ownership enrichment is wired into admin list/detail
- [ ] No TypeScript errors
